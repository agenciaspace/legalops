import datetime as dt
import json
import io
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace
import urllib.error
import runner

class SummaryTests(unittest.TestCase):
    def test_credit_fallback_retries_once_through_the_same_protected_endpoint(self):
        url='https://example.test/api/cron/whatsapp-summary'
        failure=urllib.error.HTTPError(url,503,'unavailable',{},io.BytesIO(json.dumps({'local_fallback':{'system':'privacy','prompt':'context'}}).encode()))
        response=io.BytesIO(b'{"ok":true}')
        generated={'model':'claude-cli/sonnet','text':'{"publish":false}'}
        with patch.object(runner.urllib.request,'urlopen',side_effect=[failure,response]) as request, patch.object(runner,'generate_locally',return_value=generated) as local:
            self.assertEqual(runner.post(url,{'action':'preview'},{'Authorization':'Bearer test'}),{'ok':True})
            local.assert_called_once_with({'system':'privacy','prompt':'context'})
            retried=json.loads(request.call_args.args[0].data)
            self.assertEqual(retried['local_generation'],generated)
            self.assertEqual(retried['action'],'preview')

    def test_local_generator_has_no_tools_and_does_not_persist_sessions(self):
        output=SimpleNamespace(returncode=0,stdout=json.dumps({'result':'{"publish":false}','is_error':False}))
        with patch.object(runner.subprocess,'run',return_value=output) as run:
            self.assertEqual(runner.generate_locally({'system':'privacy','prompt':'source'}),{'model':'claude-cli/sonnet','text':'{"publish":false}'})
            args=run.call_args.args[0]
            self.assertEqual(args[args.index('--tools')+1],'')
            self.assertIn('--strict-mcp-config',args)
            self.assertIn('--no-session-persistence',args)
            self.assertEqual(run.call_args.kwargs['input'],'source')
            self.assertEqual(run.call_args.kwargs['timeout'],60)

    def test_database_errors_do_not_trigger_local_generation(self):
        url='https://example.test/api/cron/whatsapp-summary'
        failure=urllib.error.HTTPError(url,503,'unavailable',{},io.BytesIO(b'{"error":"Database unavailable"}'))
        with patch.object(runner.urllib.request,'urlopen',side_effect=failure), patch.object(runner,'generate_locally') as local:
            with self.assertRaises(urllib.error.HTTPError): runner.post(url,{}, {})
            local.assert_not_called()

    def test_schedule_failure_does_not_block_either_summary(self):
        with tempfile.TemporaryDirectory() as temp:
            config={'STATE_DIR':temp,'FIRST_RUN_AT':'2026-01-01T21:00:00Z','DATABASE':':memory:','APP_URL':'https://example.test','INGEST_SECRET':'secret'}
            with patch.object(runner.sqlite3,'connect'), patch.object(runner,'process_event_comment_outbox'), patch.object(runner,'sync_bench_events',side_effect=RuntimeError('provider failed')), patch.object(runner,'process_event_summaries') as events, patch.object(runner,'process_community_summary') as community:
                with self.assertRaisesRegex(RuntimeError, 'bench-schedule'):
                    runner.run(config)
                events.assert_called_once()
                community.assert_called_once()

    def test_comment_failure_and_event_failure_leave_community_independent(self):
        with tempfile.TemporaryDirectory() as temp:
            config={'STATE_DIR':temp,'FIRST_RUN_AT':'2026-01-01T21:00:00Z','DATABASE':':memory:','APP_URL':'https://example.test','INGEST_SECRET':'secret'}
            with patch.object(runner.sqlite3,'connect'), patch.object(runner,'process_event_comment_outbox',side_effect=RuntimeError('queue failed')), patch.object(runner,'sync_bench_events') as schedule, patch.object(runner,'process_event_summaries',side_effect=RuntimeError('event failed')), patch.object(runner,'process_community_summary') as community:
                with self.assertRaisesRegex(RuntimeError, 'event-comments, event-summaries'):
                    runner.run(config)
                schedule.assert_called_once()
                community.assert_called_once()

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
