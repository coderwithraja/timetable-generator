import React, { useState } from "react";
import {
  Calendar,
  Users,
  BookOpen,
  Download,
  Edit2,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react";

const TimetableGenerator = () => {
  const [step, setStep] = useState(1);
  const [classes, setClasses] = useState(6);
  const [staticHours, setStaticHours] = useState([]);
  const [hod, setHod] = useState({ name: "", courses: [] });
  const [labs, setLabs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [timetable, setTimetable] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const periods = ["1", "2", "3", "4", "5"];

  const classNames = [
    "I-BCA-A",
    "I-BCA-B",
    "II-BCA-A",
    "II-BCA-B",
    "III-BCA-A",
    "III-BCA-B",
    "I-MCA",
    "II-MCA",
  ];

  // Initialize empty timetable
  const initTimetable = () => {
    const tt = [];
    for (let i = 0; i < classes; i++) {
      tt[i] = [];
      for (let j = 0; j < 6; j++) {
        tt[i][j] = Array(5).fill(null);
      }
    }
    return tt;
  };

  // Generate timetable logic
  const generateTimetable = () => {
    const tt = initTimetable();

    // Place static hours
    staticHours.forEach((sh) => {
      sh.slots.forEach((slot) => {
        const classIdx = Math.floor(sh.yearGroup * 2);
        if (classIdx < classes) {
          tt[classIdx][slot.day][slot.period] = sh.subject;
          if (classIdx + 1 < classes) {
            tt[classIdx + 1][slot.day][slot.period] = sh.subject;
          }
        }
      });
    });

    // Place labs
    labs.forEach((lab) => {
      let placed = 0;
      let attempts = 0;

      while (placed < lab.hours && attempts < 100) {
        const day = Math.floor(Math.random() * 6);
        const period = Math.floor(Math.random() * 5);

        let canPlace = true;

        // Check if slot is free and no adjacent conflicts
        for (let cls = 0; cls < classes; cls++) {
          if (tt[cls][day][period] && tt[cls][day][period].includes(lab.name)) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          const classIdx = lab.yearGroup * 2;
          if (classIdx < classes && !tt[classIdx][day][period]) {
            tt[classIdx][day][period] = `Lab(${lab.name})-${lab.staffA}`;
            if (classIdx + 1 < classes) {
              tt[classIdx + 1][day][period] = `Lab(${lab.name})-${lab.staffB}`;
            }
            placed++;
          }
        }
        attempts++;
      }
    });

    // Place HOD courses
    hod.courses.forEach((course) => {
      let placed = 0;
      let attempts = 0;

      while (placed < course.duration && attempts < 100) {
        const day = Math.floor(Math.random() * 6);
        const period = Math.floor(Math.random() * 3) + 1; // periods 1-3

        const classIdx = getClassIndex(course.year, course.section);

        if (classIdx < classes && !tt[classIdx][day][period]) {
          let canPlace = true;

          // Check for HOD conflicts
          for (let cls = 0; cls < classes; cls++) {
            if (
              tt[cls][day][period] &&
              tt[cls][day][period].includes(hod.name)
            ) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            tt[classIdx][day][period] = `${course.name}-${hod.name}`;
            placed++;
          }
        }
        attempts++;
      }
    });

    // Place staff courses
    staff.forEach((st) => {
      st.courses.forEach((course) => {
        let placed = 0;
        let attempts = 0;

        while (placed < course.duration && attempts < 100) {
          const day = Math.floor(Math.random() * 6);
          const period = Math.floor(Math.random() * 5);

          const classIdx = getClassIndex(course.year, course.section);

          if (classIdx < classes && !tt[classIdx][day][period]) {
            let canPlace = true;

            // Check for staff conflicts
            for (let cls = 0; cls < classes; cls++) {
              if (
                tt[cls][day][period] &&
                tt[cls][day][period].includes(st.name)
              ) {
                canPlace = false;
                break;
              }
            }

            if (canPlace) {
              tt[classIdx][day][period] = `${course.name}-${st.name}`;
              placed++;
            }
          }
          attempts++;
        }
      });
    });

    setTimetable(tt);
    setStep(5);
  };

  const getClassIndex = (year, section) => {
    const yearMap = { 1: 0, 2: 2, 3: 4, 4: 6, 5: 7 };
    const base = yearMap[year] || 0;
    return section === "A" ? base : base + 1;
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!timetable) return;

    let csv = "";

    for (let i = 0; i < classes; i++) {
      csv += `${classNames[i]}\n`;
      csv += "Day," + periods.join(",") + "\n";

      for (let day = 0; day < 6; day++) {
        csv += days[day] + ",";
        for (let period = 0; period < 5; period++) {
          csv += (timetable[i][day][period] || "") + (period < 4 ? "," : "");
        }
        csv += "\n";
      }
      csv += "\n";
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timetable.csv";
    a.click();
  };

  // Staff timetable generation
  const generateStaffTimetable = () => {
    if (!timetable) return null;

    const staffTT = {};

    [...staff, { name: hod.name }].forEach((st) => {
      staffTT[st.name] = [];
      for (let day = 0; day < 6; day++) {
        staffTT[st.name][day] = [];
        for (let period = 0; period < 5; period++) {
          let found = false;
          for (let cls = 0; cls < classes; cls++) {
            if (
              timetable[cls][day][period] &&
              timetable[cls][day][period].includes(st.name)
            ) {
              staffTT[st.name][day][
                period
              ] = `${classNames[cls]}: ${timetable[cls][day][period]}`;
              found = true;
              break;
            }
          }
          if (!found) {
            staffTT[st.name][day][period] = "Free";
          }
        }
      }
    });

    return staffTT;
  };

  const updateCell = (classIdx, day, period, value) => {
    const newTT = [...timetable];
    newTT[classIdx][day][period] = value || null;
    setTimetable(newTT);
    setSelectedCell(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-800">
                Academic Timetable Generator
              </h1>
            </div>
            {timetable && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            {["Setup", "Static Hours", "HOD", "Labs", "Staff", "Generate"].map(
              (label, idx) => (
                <React.Fragment key={idx}>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step > idx
                        ? "bg-green-500"
                        : step === idx + 1
                        ? "bg-indigo-600"
                        : "bg-gray-300"
                    } text-white font-bold`}
                  >
                    {step > idx ? <Check className="w-5 h-5" /> : idx + 1}
                  </div>
                  {idx < 5 && (
                    <div
                      className={`flex-1 h-1 ${
                        step > idx + 1 ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  )}
                </React.Fragment>
              )
            )}
          </div>
        </div>

        {/* Step 1: Setup */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Setup Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Classes
                </label>
                <input
                  type="number"
                  value={classes}
                  onChange={(e) =>
                    setClasses(
                      Math.min(8, Math.max(1, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="1"
                  max="8"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Selected classes: {classNames.slice(0, classes).join(", ")}
                </p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                Continue to Static Hours
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Static Hours */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Static Hours Configuration
            </h2>
            <div className="space-y-4">
              <StaticHoursForm
                staticHours={staticHours}
                setStaticHours={setStaticHours}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                >
                  Continue to HOD
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: HOD */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              HOD Configuration
            </h2>
            <HODForm hod={hod} setHod={setHod} />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                Continue to Labs
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Labs */}
        {step === 4 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Lab Configuration
            </h2>
            <LabsForm labs={labs} setLabs={setLabs} />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep(5)}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                Continue to Staff
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Staff */}
        {step === 5 && !timetable && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Staff Configuration
            </h2>
            <StaffForm staff={staff} setStaff={setStaff} />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Back
              </button>
              <button
                onClick={generateTimetable}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Generate Timetable
              </button>
            </div>
          </div>
        )}

        {/* Timetable Display */}
        {timetable && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Generated Timetables
                </h2>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  <Edit2 className="w-4 h-4" />
                  {editMode ? "Done Editing" : "Edit Mode"}
                </button>
              </div>

              {/* Class Timetables */}
              {Array.from({ length: classes }).map((_, classIdx) => (
                <div key={classIdx} className="mb-8">
                  <h3 className="text-xl font-bold text-indigo-600 mb-3">
                    {classNames[classIdx]}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-indigo-50">
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                            Day
                          </th>
                          {periods.map((p, idx) => (
                            <th
                              key={idx}
                              className="border border-gray-300 px-4 py-2 text-center font-semibold"
                            >
                              Period {p}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {days.map((day, dayIdx) => (
                          <tr key={dayIdx} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 font-medium">
                              {day}
                            </td>
                            {periods.map((_, periodIdx) => (
                              <td
                                key={periodIdx}
                                className="border border-gray-300 px-2 py-2 text-sm cursor-pointer hover:bg-indigo-50"
                                onClick={() =>
                                  editMode &&
                                  setSelectedCell({
                                    classIdx,
                                    day: dayIdx,
                                    period: periodIdx,
                                  })
                                }
                              >
                                {selectedCell?.classIdx === classIdx &&
                                selectedCell?.day === dayIdx &&
                                selectedCell?.period === periodIdx ? (
                                  <input
                                    type="text"
                                    defaultValue={
                                      timetable[classIdx][dayIdx][periodIdx] ||
                                      ""
                                    }
                                    onBlur={(e) =>
                                      updateCell(
                                        classIdx,
                                        dayIdx,
                                        periodIdx,
                                        e.target.value
                                      )
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        updateCell(
                                          classIdx,
                                          dayIdx,
                                          periodIdx,
                                          e.target.value
                                        );
                                      if (e.key === "Escape")
                                        setSelectedCell(null);
                                    }}
                                    autoFocus
                                    className="w-full px-2 py-1 border border-indigo-500 rounded"
                                  />
                                ) : (
                                  <div
                                    className={`${
                                      timetable[classIdx][dayIdx][periodIdx]
                                        ? "text-gray-800"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {timetable[classIdx][dayIdx][periodIdx] ||
                                      "Free"}
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Staff Timetables */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Staff Timetables
              </h2>
              {Object.entries(generateStaffTimetable() || {}).map(
                ([name, schedule]) => (
                  <div key={name} className="mb-8">
                    <h3 className="text-xl font-bold text-green-600 mb-3">
                      {name}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-green-50">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                              Day
                            </th>
                            {periods.map((p, idx) => (
                              <th
                                key={idx}
                                className="border border-gray-300 px-4 py-2 text-center font-semibold"
                              >
                                Period {p}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {days.map((day, dayIdx) => (
                            <tr key={dayIdx} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-medium">
                                {day}
                              </td>
                              {periods.map((_, periodIdx) => (
                                <td
                                  key={periodIdx}
                                  className="border border-gray-300 px-2 py-2 text-sm"
                                >
                                  <div
                                    className={`${
                                      schedule[dayIdx][periodIdx] === "Free"
                                        ? "text-gray-400"
                                        : "text-gray-800"
                                    }`}
                                  >
                                    {schedule[dayIdx][periodIdx]}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-components for forms
const StaticHoursForm = ({ staticHours, setStaticHours }) => {
  const [newStatic, setNewStatic] = useState({
    yearGroup: 0,
    subject: "",
    slots: [],
  });

  const addSlot = () => {
    setNewStatic({
      ...newStatic,
      slots: [...newStatic.slots, { day: 0, period: 0 }],
    });
  };

  const addStatic = () => {
    if (newStatic.subject) {
      setStaticHours([...staticHours, newStatic]);
      setNewStatic({ yearGroup: 0, subject: "", slots: [] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year Group
          </label>
          <select
            value={newStatic.yearGroup}
            onChange={(e) =>
              setNewStatic({
                ...newStatic,
                yearGroup: parseInt(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value={0}>Year 1</option>
            <option value={1}>Year 2</option>
            <option value={2}>Year 3</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={newStatic.subject}
            onChange={(e) =>
              setNewStatic({ ...newStatic, subject: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Library"
          />
        </div>
      </div>

      {newStatic.slots.map((slot, idx) => (
        <div key={idx} className="grid grid-cols-3 gap-4">
          <select
            value={slot.day}
            onChange={(e) => {
              const newSlots = [...newStatic.slots];
              newSlots[idx].day = parseInt(e.target.value);
              setNewStatic({ ...newStatic, slots: newSlots });
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value={0}>Monday</option>
            <option value={1}>Tuesday</option>
            <option value={2}>Wednesday</option>
            <option value={3}>Thursday</option>
            <option value={4}>Friday</option>
            <option value={5}>Saturday</option>
          </select>
          <select
            value={slot.period}
            onChange={(e) => {
              const newSlots = [...newStatic.slots];
              newSlots[idx].period = parseInt(e.target.value);
              setNewStatic({ ...newStatic, slots: newSlots });
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {[0, 1, 2, 3, 4].map((p) => (
              <option key={p} value={p}>
                Period {p + 1}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              setNewStatic({
                ...newStatic,
                slots: newStatic.slots.filter((_, i) => i !== idx),
              })
            }
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          onClick={addSlot}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          Add Time Slot
        </button>
        <button
          onClick={addStatic}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          <Check className="w-4 h-4" />
          Save Static Hour
        </button>
      </div>

      {staticHours.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Saved Static Hours:</h4>
          {staticHours.map((sh, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg mb-2">
              <span className="font-medium">{sh.subject}</span> - Year{" "}
              {sh.yearGroup + 1} ({sh.slots.length} slots)
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HODForm = ({ hod, setHod }) => {
  const [newCourse, setNewCourse] = useState({
    year: "1",
    section: "A",
    name: "",
    duration: 3,
  });

  const addCourse = () => {
    if (newCourse.name) {
      setHod({
        ...hod,
        courses: [...hod.courses, newCourse],
      });
      setNewCourse({ year: "1", section: "A", name: "", duration: 3 });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          HOD Name
        </label>
        <input
          type="text"
          value={hod.name}
          onChange={(e) => setHod({ ...hod, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter HOD name"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <select
          value={newCourse.year}
          onChange={(e) => setNewCourse({ ...newCourse, year: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
          <option value="5">Year 5</option>
        </select>
        <select
          value={newCourse.section}
          onChange={(e) =>
            setNewCourse({ ...newCourse, section: e.target.value })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="A">Section A</option>
          <option value="B">Section B</option>
        </select>
        <input
          type="text"
          value={newCourse.name}
          onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Course name"
        />
        <input
          type="number"
          value={newCourse.duration}
          onChange={(e) =>
            setNewCourse({
              ...newCourse,
              duration: parseInt(e.target.value) || 1,
            })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Hours"
          min="1"
        />
      </div>

      <button
        onClick={addCourse}
        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
      >
        <Plus className="w-4 h-4" />
        Add Course
      </button>

      {hod.courses.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">HOD Courses:</h4>
          {hod.courses.map((course, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg mb-2">
              Year {course.year}
              {course.section} - {course.name} ({course.duration} hours)
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LabsForm = ({ labs, setLabs }) => {
  const [newLab, setNewLab] = useState({
    yearGroup: 0,
    name: "",
    hours: 2,
    staffA: "",
    staffB: "",
  });

  const addLab = () => {
    if (newLab.name && newLab.staffA && newLab.staffB) {
      setLabs([...labs, newLab]);
      setNewLab({ yearGroup: 0, name: "", hours: 2, staffA: "", staffB: "" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year Group
          </label>
          <select
            value={newLab.yearGroup}
            onChange={(e) =>
              setNewLab({ ...newLab, yearGroup: parseInt(e.target.value) })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value={0}>Year 1</option>
            <option value={1}>Year 2</option>
            <option value={2}>Year 3</option>
            <option value={3}>Year 4</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lab Name
          </label>
          <input
            type="text"
            value={newLab.name}
            onChange={(e) => setNewLab({ ...newLab, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Java Lab"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hours
          </label>
          <input
            type="number"
            value={newLab.hours}
            onChange={(e) =>
              setNewLab({ ...newLab, hours: parseInt(e.target.value) || 1 })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Staff for Section A
          </label>
          <input
            type="text"
            value={newLab.staffA}
            onChange={(e) => setNewLab({ ...newLab, staffA: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Staff name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Staff for Section B
          </label>
          <input
            type="text"
            value={newLab.staffB}
            onChange={(e) => setNewLab({ ...newLab, staffB: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Staff name"
          />
        </div>
      </div>

      <button
        onClick={addLab}
        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
      >
        <Plus className="w-4 h-4" />
        Add Lab
      </button>

      {labs.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Saved Labs:</h4>
          {labs.map((lab, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg mb-2">
              <div className="font-medium">
                {lab.name} - Year {lab.yearGroup + 1}
              </div>
              <div className="text-sm text-gray-600">
                {lab.hours} hours | Section A: {lab.staffA} | Section B:{" "}
                {lab.staffB}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StaffForm = ({ staff, setStaff }) => {
  const [newStaff, setNewStaff] = useState({ name: "", courses: [] });
  const [newCourse, setNewCourse] = useState({
    year: "1",
    section: "A",
    name: "",
    duration: 3,
  });

  const addCourse = () => {
    if (newCourse.name) {
      setNewStaff({
        ...newStaff,
        courses: [...newStaff.courses, newCourse],
      });
      setNewCourse({ year: "1", section: "A", name: "", duration: 3 });
    }
  };

  const addStaff = () => {
    if (newStaff.name && newStaff.courses.length > 0) {
      setStaff([...staff, newStaff]);
      setNewStaff({ name: "", courses: [] });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Staff Name
        </label>
        <input
          type="text"
          value={newStaff.name}
          onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter staff name"
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">
          Add Courses for {newStaff.name || "Staff"}
        </h4>
        <div className="grid grid-cols-4 gap-4">
          <select
            value={newCourse.year}
            onChange={(e) =>
              setNewCourse({ ...newCourse, year: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
            <option value="5">Year 5</option>
          </select>
          <select
            value={newCourse.section}
            onChange={(e) =>
              setNewCourse({ ...newCourse, section: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
          <input
            type="text"
            value={newCourse.name}
            onChange={(e) =>
              setNewCourse({ ...newCourse, name: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Course name"
          />
          <input
            type="number"
            value={newCourse.duration}
            onChange={(e) =>
              setNewCourse({
                ...newCourse,
                duration: parseInt(e.target.value) || 1,
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Hours"
            min="1"
          />
        </div>

        <button
          onClick={addCourse}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-3"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>

        {newStaff.courses.length > 0 && (
          <div className="mt-3 bg-gray-50 p-3 rounded-lg">
            <h5 className="font-medium mb-2">Courses for {newStaff.name}:</h5>
            {newStaff.courses.map((course, idx) => (
              <div key={idx} className="text-sm mb-1">
                • Year {course.year}
                {course.section} - {course.name} ({course.duration} hours)
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={addStaff}
        disabled={!newStaff.name || newStaff.courses.length === 0}
        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        <Check className="w-4 h-4" />
        Save Staff Member
      </button>

      {staff.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h4 className="font-semibold mb-3">All Staff Members:</h4>
          {staff.map((st, idx) => (
            <div key={idx} className="bg-indigo-50 p-4 rounded-lg mb-3">
              <div className="font-bold text-indigo-700">{st.name}</div>
              <div className="text-sm mt-2">
                {st.courses.map((course, cIdx) => (
                  <div key={cIdx} className="text-gray-700">
                    • Year {course.year}
                    {course.section} - {course.name} ({course.duration} hours)
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimetableGenerator;
