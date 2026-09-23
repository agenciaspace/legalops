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
    def test_confirmed_send_only_retries_receipt(self):
        with tempfile.TemporaryDirectory() as temp:
            end=runner.slot(dt.datetime.now(runner.UTC))
            state=Path(temp)/(end.strftime('%Y%m%dT%H%M%S')+'.json')
            runner.save(state,{'status':'sent','summary_id':'saved-id'})
            config={'STATE_DIR':temp,'FIRST_RUN_AT':'2026-01-01T21:00:00Z','DATABASE':':memory:','APP_URL':'https://example.test','INGEST_SECRET':'secret'}
            with patch.object(runner.sqlite3,'connect') as connect, patch.object(runner,'post',return_value={'ok':True}) as post:
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
            with patch.object(runner.sqlite3,'connect') as connect, patch.object(runner,'post') as post:
                connect.return_value.execute.return_value.fetchone.return_value=None
                with self.assertRaises(RuntimeError):runner.run(config)
                post.assert_not_called()
if __name__=='__main__':unittest.main()
