import datetime as dt
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
import runner

class SummaryTests(unittest.TestCase):
    def test_window(self):
        before=dt.datetime(2026,9,18,20,59,tzinfo=runner.UTC)
        self.assertEqual(runner.iso(runner.slot(before)), '2026-09-17T21:00:00Z')
        self.assertEqual(runner.iso(runner.slot(before+dt.timedelta(minutes=1))), '2026-09-18T21:00:00Z')
    def test_source_filter_and_transcription(self):
        db=sqlite3.connect(':memory:')
        db.execute('create table messages(wm_id,ts,sender_jid,sender_name,from_me,text,msg_id,chat_jid,owner,deleted)')
        db.execute('create table audio_transcriptions(id,webhook_msg_id,status,transcription)')
        end=dt.datetime(2026,9,18,21,tzinfo=runner.UTC)
        base=[1,end.timestamp()-1,'author','Giulliana Canesin 🌷',0,'Message','m1',runner.GROUP,runner.OWNER,0]
        rows=[base]
        for index,changes in enumerate([{7:'other-group'},{8:'other-owner'},{9:1},{1:end.timestamp()},{1:(end-runner.DAY).timestamp()-1},{5:runner.PREFIX+' body'},{5:''},{5:''},{6:'m1'}],start=2):
            row=base.copy();row[0]=index;row[6]=f'm{index}'
            for key,value in changes.items():row[key]=value
            rows.append(row)
        db.executemany('insert into messages values(?,?,?,?,?,?,?,?,?,?)',rows)
        db.execute('insert into audio_transcriptions values(1,8,"done","Audio transcription")')
        messages,omitted=runner.collect(db,end)
        self.assertEqual([m['text'] for m in messages],['Message','Audio transcription'])
        self.assertEqual(omitted,1)
        self.assertEqual(messages[0]['author'],'Giulliana Canesin')
    def test_author_names_and_phone_mentions_are_sanitized(self):
        self.assertEqual(runner.clean_display_name('Gonçalves, Mario'), 'Mario Gonçalves')
        self.assertEqual(runner.clean_display_name('Leon 🤖'), 'Leon')
        self.assertEqual(runner.sanitize_text('Valeu @5511982018903, ligue +5511999999999'), 'Valeu @membro, ligue [contato omitido]')
    def test_bench_sync_sends_new_context_once(self):
        db=sqlite3.connect(':memory:')
        db.execute('create table messages(wm_id,ts,sender_jid,sender_name,from_me,text,msg_id,chat_jid,owner,deleted,msg_type)')
        now=dt.datetime(2026,9,29,18,tzinfo=runner.UTC)
        group=next(iter(runner.BENCH_GROUPS))
        db.execute('insert into messages values(1,?,?,?,?,?,?,?,?,?,?)',(now.timestamp()-60,'author','Alexander',0,'Ficamos para dia 14, às 19','m1',group,runner.OWNER,0,'Conversation'))
        with tempfile.TemporaryDirectory() as temp, patch.object(runner,'post',return_value={'ok':True,'confirmed':True}) as post:
            config={'APP_URL':'https://example.test'};headers={'Authorization':'Bearer secret'};state=Path(temp)
            runner.sync_bench_events(db,config,state,headers,now)
            runner.sync_bench_events(db,config,state,headers,now)
            self.assertEqual(post.call_count,1)
            payload=post.call_args.args[1]
            self.assertEqual(payload['group_id'],group)
            self.assertEqual(payload['messages'][0]['text'],'Ficamos para dia 14, às 19')
    def test_event_summary_is_scoped_and_sent_to_its_group(self):
        db=sqlite3.connect(':memory:')
        db.execute('create table messages(wm_id,ts,sender_jid,sender_name,from_me,text,msg_id,chat_jid,owner,deleted)')
        db.execute('create table audio_transcriptions(id,webhook_msg_id,status,transcription)')
        end=dt.datetime(2026,9,30,21,tzinfo=runner.UTC)
        group=next(iter(runner.EVENT_SUMMARY_GROUPS))
        db.execute('insert into messages values(1,?,?,?,?,?,?,?,?,?)',(end.timestamp()-60,'author','Ana',0,'Integração exige fila de aprovação.','m1',group,runner.OWNER,0))
        summary={'id':'summary-id','period_end':runner.iso(end),'title':'Integração com ERP','summary':'A integração exige uma fila de aprovação.','key_points':['Contexto — Foi discutida uma fila de aprovação.'],'source_message_count':1,'whatsapp_sent_at':None}
        def response(url,body,headers):
            if url.endswith('/api/cron/whatsapp-summary') and body.get('action') == 'publish': return {'ok':True,'summary':summary}
            if url.endswith('/send/text'): return {'success':True,'id':'message-id'}
            return {'ok':True}
        with tempfile.TemporaryDirectory() as temp, patch.object(runner,'post',side_effect=response) as post, patch.object(runner,'connected_instance',return_value=('https://instance.test','token')):
            runner.process_event_summaries(db,{'APP_URL':'https://example.test'},Path(temp),{'Authorization':'Bearer secret'},end+dt.timedelta(minutes=1),end)
            publish=next(call.args[1] for call in post.call_args_list if call.args[1].get('action') == 'publish')
            delivery=next(call.args[1] for call in post.call_args_list if call.args[0].endswith('/send/text'))
            self.assertEqual(publish['source'],'event:bench-netlex-2026')
            self.assertEqual(delivery['number'],group)
            self.assertIn('*Resumo · Bench NetLex*',delivery['text'])
            self.assertIn('?tab=discussoes#publicacoes',delivery['text'])
            self.assertNotIn('mensagens · síntese',delivery['text'])
            self.assertNotIn('Brasília',delivery['text'])

    def test_event_summary_limits_the_whatsapp_message_to_three_points(self):
        summary={
            'period_end':'2026-09-30T21:00:00Z',
            'title':'Workflows, integrações e suporte',
            'summary':'O grupo trocou experiências práticas sobre o NetLex.',
            'key_points':['Ponto um.','Ponto dois.','Ponto três.','Ponto quatro.'],
            'source_message_count':189,
        }
        text=runner.render_event(summary,runner.EVENT_SUMMARY_GROUPS['120363432116359544@g.us'])
        self.assertEqual(text.count('\n• '),3)
        self.assertNotIn('Ponto quatro.',text)
    def test_event_comment_is_forwarded_once_and_acknowledged(self):
        db=sqlite3.connect(':memory:')
        db.execute('create table messages(msg_id,text,chat_jid,owner,from_me,ts)')
        notification={'id':'11111111-1111-4111-8111-111111111111','group_id':'120363432116359544@g.us','event_slug':'bench-netlex-2026','topic':'Integrações e dados','author':'Ana Lima','body':'Como vocês trataram a integração com o ERP?'}
        calls=[]
        def response(url,body,headers):
            calls.append((url,body))
            if body.get('action') == 'pull-event-comments': return {'ok':True,'notifications':[notification]}
            if url.endswith('/send/text'): return {'success':True,'id':'message-id'}
            return {'ok':True}
        with tempfile.TemporaryDirectory() as temp, patch.object(runner,'post',side_effect=response), patch.object(runner,'connected_instance',return_value=('https://instance.test','token')):
            runner.process_event_comment_outbox(db,{'APP_URL':'https://example.test'},Path(temp),{'Authorization':'Bearer secret'})
            delivery=next(body for url,body in calls if url.endswith('/send/text'))
            acknowledgement=next(body for _,body in calls if body.get('action') == 'delivered-event-comment')
            self.assertEqual(delivery['number'],notification['group_id'])
            self.assertIn(notification['body'],delivery['text'])
            self.assertIn(notification['topic'],delivery['text'])
            self.assertEqual(acknowledgement['id'],notification['id'])
    def test_confirmed_send_only_retries_receipt(self):
        with tempfile.TemporaryDirectory() as temp:
            end=runner.slot(dt.datetime.now(runner.UTC))
            state=Path(temp)/(end.strftime('%Y%m%dT%H%M%S')+'.json')
            runner.save(state,{'status':'sent','summary_id':'saved-id'})
            config={'STATE_DIR':temp,'FIRST_RUN_AT':'2026-01-01T21:00:00Z','DATABASE':':memory:','APP_URL':'https://example.test','INGEST_SECRET':'secret'}
            with patch.object(runner.sqlite3,'connect') as connect, patch.object(runner,'process_event_comment_outbox'), patch.object(runner,'sync_bench_events'), patch.object(runner,'process_event_summaries'), patch.object(runner,'post',return_value={'ok':True}) as post:
                runner.run(config)
            self.assertEqual(post.call_count,1)
            self.assertEqual(post.call_args.args[1],{'action':'delivered','id':'saved-id'})
            self.assertEqual(json.loads(state.read_text())['status'],'done')
    def test_unknown_send_never_blindly_resends(self):
        with tempfile.TemporaryDirectory() as temp:
            end=runner.slot(dt.datetime.now(runner.UTC))
            state=Path(temp)/(end.strftime('%Y%m%dT%H%M%S')+'.json')
            runner.save(state,{'status':'sending','summary_id':'saved-id','text':'summary'})
            config={'STATE_DIR':temp,'FIRST_RUN_AT':'2026-01-01T21:00:00Z','DATABASE':':memory:','APP_URL':'https://example.test','INGEST_SECRET':'secret'}
            with patch.object(runner.sqlite3,'connect') as connect, patch.object(runner,'process_event_comment_outbox'), patch.object(runner,'sync_bench_events'), patch.object(runner,'process_event_summaries'), patch.object(runner,'post') as post:
                connect.return_value.execute.return_value.fetchone.return_value=None
                with self.assertRaises(RuntimeError):runner.run(config)
                post.assert_not_called()
if __name__=='__main__':unittest.main()
