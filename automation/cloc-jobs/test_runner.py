import sqlite3
import time
import unittest
import runner

class ImportTests(unittest.TestCase):
    def setUp(self):
        self.source=sqlite3.connect(':memory:')
        self.source.execute('create table messages(wm_id integer,ts real,text text,msg_type text,chat_jid text,owner text,deleted integer)')
        self.queue=sqlite3.connect(':memory:')
        runner.init_queue(self.queue)
        self.now=time.time()

    def add(self,identifier,text,group='cloc',owner='owner',deleted=0,age=1):
        self.source.execute('insert into messages values(?,?,?,?,?,?,?)',(identifier,self.now-age,text,'Conversation',group,owner,deleted))

    def collect(self):
        return runner.collect(self.source,self.queue,['cloc','cloc2'],'owner',self.now)

    def test_duplicate_in_two_groups_is_one_job_with_two_sources(self):
        self.add(1,'https://www.linkedin.com/jobs/view/123456789/?utm_source=wa')
        self.add(2,'https://www.linkedin.com/jobs/view/123456789','cloc2')
        self.assertEqual(self.collect(),1)
        self.assertEqual(self.collect(),0)
        self.assertEqual(self.queue.execute('select count(*) from sources').fetchone()[0],2)

    def test_scope_deletion_owner_and_time_window(self):
        for identifier,opts in enumerate([{'group':'other'},{'owner':'other'},{'deleted':1},{'age':31*86400}]):
            self.add(identifier,'https://acme.gupy.io/jobs/123',**opts)
        self.assertEqual(self.collect(),0)

    def test_bare_link_is_captured_but_chat_is_not(self):
        self.add(1,'https://acme.gupy.io/jobs/123')
        self.add(2,'Bom dia!')
        self.assertEqual(self.collect(),1)

    def test_no_link_stays_pending_without_sending_text(self):
        self.add(1,'Vaga de controller, envie currículo no privado')
        self.collect()
        self.assertEqual(self.queue.execute('select status,reason from items').fetchone(),('pending','no_application_link'))
        self.assertEqual(runner.process(self.queue,{},send=lambda *_:self.fail('must not send')), {})

    def test_failed_request_retries_without_losing_queue(self):
        self.add(1,'https://acme.gupy.io/jobs/123')
        self.collect()
        def fail(*_): raise TimeoutError()
        self.assertEqual(runner.process(self.queue,{},send=fail),{'retry':1})
        self.assertEqual(runner.process(self.queue,{},send=fail),{})
        self.queue.execute('update items set next_attempt=0')
        self.assertEqual(runner.process(self.queue,{},send=lambda *_:{'status':'published','job_id':'ok'}),{'published':1})
        self.assertEqual(runner.process(self.queue,{},send=fail),{})

    def test_late_arrival_with_old_timestamp_is_not_missed(self):
        self.collect()
        self.add(50,'https://acme.gupy.io/jobs/123',age=86400)
        self.assertEqual(self.collect(),1)

if __name__=='__main__': unittest.main()
