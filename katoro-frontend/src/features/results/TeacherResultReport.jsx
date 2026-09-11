import { useEffect, useState } from 'react';
import { academicYearsApi } from '../academicYears/academicYearsApi';
import { termsApi } from '../terms/termsApi';
import { examsApi } from '../exams/examsApi';
import { resultsApi } from './resultsApi';
import { exportToExcel } from '../../utils/exportToExcel';

// School letterhead — kept consistent with the other printable reports
// (ClassDivisionReportPage.jsx, StudentResultSlip.jsx, StudentReportCard.jsx).
// Change these to match your school if it differs from Lupeta.
const OFFICE_LINE_1 = "PRESIDENT'S OFFICE";
const OFFICE_LINE_2 = 'REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT';
const REGION_LINE = 'MBEYA CITY, MBEYA';
const SCHOOL_NAME = 'LUPETA SECONDARY SCHOOL';

const GRADE_COLUMNS = ['A', 'B', 'C', 'D', 'F'];
const DIVISION_COLUMNS = [
  { key: 'I', label: 'I' },
  { key: 'II', label: 'II' },
  { key: 'III', label: 'III' },
  { key: 'IV', label: 'IV' },
  { key: 0, label: '0' },
];

function formatGpa(gpa) {
  return gpa == null || Number.isNaN(gpa) ? '—' : gpa.toFixed(2);
}

export default function TeacherResultReport() {
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [exams, setExams] = useState([]);

  const [academicYearId, setAcademicYearId] = useState('');
  const [termId, setTermId] = useState('');
  const [examId, setExamId] = useState('');

  const [report, setReport] = useState(null);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState('');

  // Academic years, defaulting to the current one.
  useEffect(() => {
    academicYearsApi
      .getAll()
      .then((res) => {
        setYears(res.data);
        const current = res.data.find((y) => y.is_current) || res.data[0];
        if (current) setAcademicYearId(String(current.id));
      })
      .catch(() => setError('Failed to load academic years.'))
      .finally(() => setLoadingLookups(false));
  }, []);

  // Terms for the selected year.
  useEffect(() => {
    if (!academicYearId) return;
    termsApi.getAll({ academic_year_id: academicYearId }).then((res) => {
      setTerms(res.data);
      const current = res.data.find((t) => t.is_current) || res.data[0];
      setTermId(current ? String(current.id) : '');
    });
  }, [academicYearId]);

  // Exams for the selected term.
  useEffect(() => {
    if (!termId) {
      setExams([]);
      return;
    }
    examsApi.getAll({ term_id: termId }).then((res) => {
      setExams(res.data);
      if (!examId || !res.data.some((ex) => String(ex.id) === String(examId))) {
        setExamId(res.data[0] ? String(res.data[0].id) : '');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId]);

  useEffect(() => {
    if (!examId) {
      setReport(null);
      return;
    }
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  async function loadReport() {
    setLoadingReport(true);
    setError('');
    try {
      const res = await resultsApi.getTeacherReport({ exam_id: examId });
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load the teacher performance report.');
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  }

  const meta = report?.meta || {};
  const rows = report?.rows || [];
  const examName = meta.exam_name || '';
  const yearName = meta.year_name || '';

  function handleExportExcel() {
    if (!rows.length) return;
    const sheetRows = rows.map((r) => ({
      Position: r.position,
      'Teacher Name': r.teacher_name,
      Subject: r.subject_name,
      A: r.grades.A,
      B: r.grades.B,
      C: r.grades.C,
      D: r.grades.D,
      F: r.grades.F,
      'Div I': r.divisions.I,
      'Div II': r.divisions.II,
      'Div III': r.divisions.III,
      'Div IV': r.divisions.IV,
      'Div 0': r.divisions[0],
      GPA: formatGpa(r.gpa),
    }));
    const label = `Teacher-Performance-${examName || 'Exam'}`;
    exportToExcel(sheetRows, label.replace(/\s+/g, '-'), 'Teacher Performance');
  }

  return (
    <div className="p-4">
      {/* Print-only styling, scoped to this page — same pattern as
          ClassDivisionReportPage.jsx: hide the filter toolbar, strip the
          report sheet's card chrome, and keep rows tight/unsplit. */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .teacher-report-sheet {
            border: none !important;
            box-shadow: none !important;
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .teacher-report-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Filters / toolbar — hidden when printing */}
      <div className="no-print">
        <h2 className="text-xl font-semibold text-slate-900">Teacher Performance Report</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ranks every teacher, by subject, from best to lowest performance for the exam you pick — showing their
          students' grade (A-F) and division (I-IV, 0) breakdown.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year</label>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              disabled={loadingLookups}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.year_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Term</label>
            <select
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              disabled={!academicYearId}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            >
              {terms.length === 0 && <option value="">No terms</option>}
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Exam *</label>
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              disabled={!termId}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            >
              {exams.length === 0 && <option value="">No exams</option>}
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => window.print()}
            disabled={!rows.length}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            Download PDF (Print)
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!rows.length}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Export to Excel
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {!examId && !error && (
          <p className="mt-6 text-sm text-slate-500">Select an Exam above to view the teacher ranking.</p>
        )}
        {examId && loadingReport && <p className="mt-6 text-sm text-slate-500">Loading results...</p>}
      </div>

      {/* Printable report */}
      {examId && !loadingReport && report && (
        <div
          className="teacher-report-sheet mx-auto mt-6 max-w-5xl rounded-lg border border-slate-200 bg-[#eafffb] p-8"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          <div className="text-center">
            <p className="font-bold text-slate-900">{OFFICE_LINE_1}</p>
            <p className="font-bold text-slate-900">{OFFICE_LINE_2}</p>
            <p className="font-bold text-slate-900">{REGION_LINE}</p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">{SCHOOL_NAME}</p>
          </div>

          <h3 className="mt-4 text-center text-lg font-extrabold uppercase text-purple-700">
            Teacher Performance Ranking — {examName} {yearName}
          </h3>

          <table className="teacher-report-table mt-6 w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="border border-slate-400 bg-sky-200 px-2 py-1 text-center font-bold uppercase text-slate-900">
                  Position
                </th>
                <th className="border border-slate-400 bg-sky-200 px-2 py-1 text-left font-bold uppercase text-slate-900">
                  Teacher Name
                </th>
                <th className="border border-slate-400 bg-sky-200 px-2 py-1 text-left font-bold uppercase text-slate-900">
                  Subject
                </th>
                {GRADE_COLUMNS.map((g) => (
                  <th key={g} className="border border-slate-400 bg-sky-200 px-2 py-1 text-center font-bold text-slate-900">
                    {g}
                  </th>
                ))}
                {DIVISION_COLUMNS.map((d) => (
                  <th
                    key={d.key}
                    className="border border-slate-400 bg-emerald-100 px-2 py-1 text-center font-bold text-slate-900"
                  >
                    Div {d.label}
                  </th>
                ))}
                <th className="border border-slate-400 bg-sky-200 px-2 py-1 text-center font-bold uppercase text-slate-900">
                  Gpa
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.teacher_name}-${r.subject_code}-${idx}`} className={idx % 2 === 1 ? 'bg-sky-50' : 'bg-white'}>
                  <td className="border border-slate-300 px-2 py-1 text-center font-semibold">{r.position}</td>
                  <td className="border border-slate-300 px-2 py-1 font-medium">{r.teacher_name}</td>
                  <td className="border border-slate-300 px-2 py-1">{r.subject_name}</td>
                  {GRADE_COLUMNS.map((g) => (
                    <td key={g} className="border border-slate-300 px-2 py-1 text-center">
                      {r.grades[g] ?? 0}
                    </td>
                  ))}
                  {DIVISION_COLUMNS.map((d) => (
                    <td key={d.key} className="border border-slate-300 px-2 py-1 text-center">
                      {r.divisions[d.key] ?? 0}
                    </td>
                  ))}
                  <td className="border border-slate-300 px-2 py-1 text-center">{formatGpa(r.gpa)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4 + GRADE_COLUMNS.length + DIVISION_COLUMNS.length} className="border border-slate-300 px-3 py-8 text-center text-slate-400">
                    No teacher/subject results to show for this exam yet — make sure Class Subjects have a
                    teacher assigned and results have been entered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <p className="mt-2 text-right text-[10px] italic text-slate-500">
            The report generated by {SCHOOL_NAME} — {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}
