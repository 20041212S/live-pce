"use client";

import { useEffect, useState } from 'react';

type TimeTable = any;
type ExamTime = any;

export default function TimetablesPage() {
  const [timetables, setTimetables] = useState<TimeTable[]>([]);
  const [exams, setExams] = useState<ExamTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRow, setNewRow] = useState({ program: '', semester: '', section: '', dayOfWeek: '', period: '', subject: '', staffName: '', room: '' });
  const [newExam, setNewExam] = useState({ program: '', semester: '', examType: '', examDate: '', subject: '', subjectCode: '', session: '', room: '' });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tRes, eRes] = await Promise.all([fetch('/api/admin/timetables'), fetch('/api/admin/exam-timetables')]);
      const [tData, eData] = await Promise.all([tRes.json(), eRes.json()]);
      setTimetables(tData || []);
      setExams(eData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRow = async () => {
    try {
      const res = await fetch('/api/admin/timetables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRow) });
      if (res.ok) {
        setNewRow({ program: '', semester: '', section: '', dayOfWeek: '', period: '', subject: '', staffName: '', room: '' });
        loadAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExam = async () => {
    try {
      const res = await fetch('/api/admin/exam-timetables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newExam) });
      if (res.ok) {
        setNewExam({ program: '', semester: '', examType: '', examDate: '', subject: '', subjectCode: '', session: '', room: '' });
        loadAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Time Tables</h1>
      <p className="text-sm text-gray-600 mb-6">Manage class and exam timetables.</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Class Time Table</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input placeholder="Program" value={newRow.program} onChange={(e) => setNewRow({ ...newRow, program: e.target.value })} className="input" />
          <input placeholder="Semester" value={newRow.semester} onChange={(e) => setNewRow({ ...newRow, semester: e.target.value })} className="input" />
          <input placeholder="Section" value={newRow.section} onChange={(e) => setNewRow({ ...newRow, section: e.target.value })} className="input" />
          <input placeholder="Day of Week" value={newRow.dayOfWeek} onChange={(e) => setNewRow({ ...newRow, dayOfWeek: e.target.value })} className="input" />
          <input placeholder="Period" value={newRow.period} onChange={(e) => setNewRow({ ...newRow, period: e.target.value })} className="input" />
          <input placeholder="Subject" value={newRow.subject} onChange={(e) => setNewRow({ ...newRow, subject: e.target.value })} className="input" />
          <input placeholder="Staff Name" value={newRow.staffName} onChange={(e) => setNewRow({ ...newRow, staffName: e.target.value })} className="input" />
          <input placeholder="Room" value={newRow.room} onChange={(e) => setNewRow({ ...newRow, room: e.target.value })} className="input" />
        </div>
        <div className="flex gap-3">
          <button onClick={handleCreateRow} className="btn-primary">Add Row</button>
          <button onClick={loadAll} className="btn-secondary">Refresh</button>
        </div>

        <div className="mt-6">
          {loading ? <p>Loading...</p> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left"><th>Program</th><th>Semester</th><th>Day</th><th>Period</th><th>Subject</th><th>Staff</th><th>Room</th></tr>
              </thead>
              <tbody>
                {timetables.map((t: any) => (
                  <tr key={t.id}><td>{t.program}</td><td>{t.semester}</td><td>{t.dayOfWeek}</td><td>{t.period}</td><td>{t.subject}</td><td>{t.staffName}</td><td>{t.room}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Exam Time Table</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input placeholder="Program" value={newExam.program} onChange={(e) => setNewExam({ ...newExam, program: e.target.value })} className="input" />
          <input placeholder="Semester" value={newExam.semester} onChange={(e) => setNewExam({ ...newExam, semester: e.target.value })} className="input" />
          <input placeholder="Exam Type" value={newExam.examType} onChange={(e) => setNewExam({ ...newExam, examType: e.target.value })} className="input" />
          <input type="date" placeholder="Exam Date" value={newExam.examDate} onChange={(e) => setNewExam({ ...newExam, examDate: e.target.value })} className="input" />
          <input placeholder="Subject" value={newExam.subject} onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })} className="input" />
          <input placeholder="Subject Code" value={newExam.subjectCode} onChange={(e) => setNewExam({ ...newExam, subjectCode: e.target.value })} className="input" />
          <input placeholder="Session (FN/AN)" value={newExam.session} onChange={(e) => setNewExam({ ...newExam, session: e.target.value })} className="input" />
          <input placeholder="Room" value={newExam.room} onChange={(e) => setNewExam({ ...newExam, room: e.target.value })} className="input" />
        </div>
        <div className="flex gap-3">
          <button onClick={handleCreateExam} className="btn-primary">Add Exam</button>
          <button onClick={loadAll} className="btn-secondary">Refresh</button>
        </div>

        <div className="mt-6">
          {loading ? <p>Loading...</p> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left"><th>Program</th><th>Semester</th><th>Type</th><th>Date</th><th>Subject</th><th>Code</th><th>Session</th><th>Room</th></tr>
              </thead>
              <tbody>
                {exams.map((e: any) => (
                  <tr key={e.id}><td>{e.program}</td><td>{e.semester}</td><td>{e.examType}</td><td>{new Date(e.examDate).toLocaleDateString()}</td><td>{e.subject}</td><td>{e.subjectCode}</td><td>{e.session}</td><td>{e.room}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
