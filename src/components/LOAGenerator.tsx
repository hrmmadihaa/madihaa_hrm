import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSearchParams } from 'react-router-dom';

type Candidate = {
  id: string;
  Name: string;
  'EMP ID': string;
  POSITION?: string;
  department?: string;
  nationality?: string;
  date_of_birth?: string;
  passport_no?: string;
  national_id?: string;
  contact_no?: string;
  emergency_contact?: string;
  permanent_address?: string;
  employment_type?: string;
  'D.O.J'?: string;
  salary?: string;
  working_hours?: string;
  work_location?: string;
  reporting_to?: string;
  // LOA optional fields
  business_activity?: string;
  salary_currency?: string;
  exchange_rate?: string;
  food_accommodation?: string;
  salary_payment?: string;
  job_description?: string;
  contract_duration?: string;
};

type LOAData = {
  letterDate: string;
  employerName: string;
  registration: string;
  employerAddress: string;
  employerContact: string;
  country: string;

  employeeName: string;
  permanentAddress: string;
  nationality: string;
  dateOfBirth: string;
  passportNo: string;
  nationalId: string;
  contactNo: string;
  emergencyContact: string;

  jobTitle: string;
  businessActivity: string;
  basicSalary: string;
  exchangeRate: string;
  salaryCurrency: string;
  foodAccommodation: string;
  salaryPayment: string;
  workSite: string;
  commencementDate: string;
  jobDescription: string;
  workingHours: string;
  contractDuration: string;

  probationPeriod: string;
  probationCondition: string;
  annualLeaveCondition1: string;
  annualLeaveCondition2: string;
  annualLeaveCondition3: string;

  closingMessage: string;
  signatoryName: string;
  signatoryDesignation: string;
  acceptanceText: string;
};

const initialData: LOAData = {
  letterDate: new Date().toISOString().split("T")[0],

  employerName: "Madihaa Company Pvt Ltd",
  registration: "C-0014/1985",
  employerAddress:
    "M. Madihaa, Shaheed Ali Hingun, Malé, Maldives",
  employerContact: "+960 332 8827 | admin@madihaa.mv",
  country: "Republic of Maldives",

  employeeName: "",
  permanentAddress: "",
  nationality: "",
  dateOfBirth: "",
  passportNo: "",
  nationalId: "",
  contactNo: "",
  emergencyContact: "",

  jobTitle: "Labourer, Odd Job",
  businessActivity: "Wholesale & Retail Sale except Motor Vehicles",
  basicSalary: "300.00",
  exchangeRate: "15.42",
  salaryCurrency: "USD",
  foodAccommodation: "Provided",
  salaryPayment: "Before 15th of every month",
  workSite:
    "Ufanveli Shop, Hulhumale Lot 11174, Bokarumaa Hingun, K. Hulhumale, Maldives",
  commencementDate: "",
  jobDescription:
    "Carry out loading and unloading works and other odd jobs assigned by the management.",
  workingHours: "10 Hours (Including Breaks)",
  contractDuration: "2 years from the date of joining",

  probationPeriod: "Three (03) months",
  probationCondition:
    "During the initial three (03) months of probation period, the company reserves the right to terminate employment at any time if the employee is found unsuitable for the position. In such circumstances, the return ticket will be borne by the employee.",

  annualLeaveCondition1:
    "Upon completion of two (02) consecutive years of service, the employer will provide a round-trip ticket and 60 days of annual leave.",

  annualLeaveCondition2:
    "Upon completion of one (01) year and six (06) months of service, the employer will provide a one-way ticket and 30 days of annual leave.",

  annualLeaveCondition3:
    "If the employee does not utilize the return ticket, annual leave salary will not be provided.",

  closingMessage:
    "We look forward to welcoming you onboard to our team, and we hope to utilize your knowledge and expertise to attain the company's goals and uphold the standards we envision.",

  signatoryName: "",
  signatoryDesignation: "Managing Director",

  acceptanceText:
    "I agree to the terms and conditions stated above and accept this offer of employment.",
};

const formatDate = (value: string) => {
  if (!value) return "________________";

  const d = new Date(value + "T00:00:00");

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const money = (data: LOAData) => {
  const amount = Number(data.basicSalary);
  const rate = Number(data.exchangeRate);

  if (!Number.isFinite(amount)) return data.basicSalary;

  if (!Number.isFinite(rate) || !rate) {
    return `${data.salaryCurrency} ${amount.toFixed(2)}`;
  }

  return `${data.salaryCurrency} ${amount.toFixed(2)} (Paid in Maldivian Rufiyaa at ${rate})`;
};

export default function LOAGenerator() {
  const [searchParams] = useSearchParams();
  const candidateIdFromUrl = searchParams.get('candidateId');

  const [data, setData] = useState<LOAData>(initialData);
  const [showForm, setShowForm] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const candidatesQuery = query(collection(db, 'recruitment_candidates'), orderBy('created_date', 'desc'));
      const candidatesSnapshot = await getDocs(candidatesQuery);
      const candidatesData = candidatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Candidate));
      setCandidates(candidatesData);

      // If candidateId is in URL, select that candidate
      if (candidateIdFromUrl && candidatesData.find(c => c.id === candidateIdFromUrl)) {
        setSelectedCandidateId(candidateIdFromUrl);
        const selectedCandidate = candidatesData.find(c => c.id === candidateIdFromUrl);
        if (selectedCandidate) {
          handleCandidateSelect(candidateIdFromUrl);
        }
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  const handleCandidateSelect = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    const candidate = candidates.find(c => c.id === candidateId);

    if (candidate) {
      const isMaldivian = candidate.nationality?.toLowerCase().includes('maldives') ||
                          candidate.nationality?.toLowerCase().includes('maldivian');

      setData(prev => ({
        ...prev,
        employeeName: candidate.Name || "",
        permanentAddress: candidate.permanent_address || "",
        nationality: candidate.nationality || "",
        dateOfBirth: candidate.date_of_birth || "",
        passportNo: isMaldivian ? "" : (candidate.passport_no || ""),
        nationalId: isMaldivian ? (candidate.national_id || candidate['EMP ID'] || "") : "",
        contactNo: candidate.contact_no || "",
        emergencyContact: candidate.emergency_contact || "",
        jobTitle: candidate.POSITION || prev.jobTitle,
        businessActivity: candidate.business_activity || prev.businessActivity,
        commencementDate: candidate['D.O.J'] ? formatDate(candidate['D.O.J']) : "",
        basicSalary: candidate.salary || prev.basicSalary,
        salaryCurrency: candidate.salary_currency || prev.salaryCurrency,
        exchangeRate: candidate.exchange_rate || prev.exchangeRate,
        foodAccommodation: candidate.food_accommodation || prev.foodAccommodation,
        salaryPayment: candidate.salary_payment || prev.salaryPayment,
        workSite: candidate.work_location || prev.workSite,
        jobDescription: candidate.job_description || prev.jobDescription,
        workingHours: candidate.working_hours || prev.workingHours,
        contractDuration: candidate.contract_duration || prev.contractDuration,
      }));
    }
  };

  const update = (key: keyof LOAData, value: string) => {
    setData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const printLOA = () => {
    window.print();
  };

  const field = (
    key: keyof LOAData,
    label: string,
    type = "text"
  ) => (
    <label className="loa-field" key={key}>
      <span>{label}</span>
      <input
        type={type}
        value={data[key]}
        onChange={(e) => update(key, e.target.value)}
      />
    </label>
  );

  const textarea = (
    key: keyof LOAData,
    label: string,
    rows = 3
  ) => (
    <label className="loa-field" key={key}>
      <span>{label}</span>
      <textarea
        rows={rows}
        value={data[key]}
        onChange={(e) => update(key, e.target.value)}
      />
    </label>
  );

  const section = (
    number: string,
    title: string,
    children: React.ReactNode
  ) => (
    <section className="loa-section">
      <h3>{number}. {title}</h3>
      <div className="loa-section-content">{children}</div>
    </section>
  );

  const detail = (label: string, value: string) => (
    <div className="loa-detail" key={label}>
      <span className="loa-detail-label">{label}:</span>
      <span className="loa-detail-value">
        {value || "________________"}
      </span>
    </div>
  );

  const isMaldivian = data.nationality?.toLowerCase().includes('maldives') || 
                      data.nationality?.toLowerCase().includes('maldivian');

  return (
    <div className="loa-app">
      <style>{`
        .loa-app {
          min-height: 100vh;
          background: #f1f4f8;
          padding: 22px;
          color: #172033;
          font-family: Arial, sans-serif;
        }

        .loa-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .loa-toolbar h2 {
          font-size: 22px;
          margin: 0 0 5px;
        }

        .loa-toolbar p {
          margin: 0;
          color: #718096;
          font-size: 13px;
        }

        .loa-actions {
          display: flex;
          gap: 9px;
        }

        .loa-btn {
          border: 0;
          border-radius: 7px;
          padding: 11px 17px;
          font-weight: 600;
          cursor: pointer;
        }

        .loa-btn-primary {
          background: #155fc0;
          color: white;
        }

        .loa-btn-secondary {
          background: #e2e8f0;
          color: #27364a;
        }

        .loa-layout {
          display: grid;
          grid-template-columns: 330px minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }

        .loa-form {
          background: white;
          padding: 18px;
          border-radius: 11px;
          border: 1px solid #e1e7ef;
          max-height: calc(100vh - 100px);
          overflow-y: auto;
        }

        .loa-form h3 {
          font-size: 15px;
          margin: 17px 0 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e8edf3;
        }

        .loa-form h3:first-child {
          margin-top: 0;
        }

        .loa-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 11px;
        }

        .loa-field span {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }

        .loa-field input,
        .loa-field textarea,
        .loa-field select {
          width: 100%;
          box-sizing: border-box;
          padding: 9px;
          border: 1px solid #d8e0e9;
          border-radius: 6px;
          font: inherit;
          font-size: 13px;
        }

        .loa-field textarea {
          resize: vertical;
        }

        .loa-preview-area {
          min-width: 0;
          overflow-x: auto;
        }

        .loa-preview-heading {
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .loa-preview {
          display: flex;
          justify-content: center;
          min-width: 0;
        }

        .loa-paper {
          width: 210mm;
          height: 297mm;
          min-width: 210mm;
          box-sizing: border-box;
          padding: 10mm 13mm 9mm;
          background: white;
          color: #111;
          box-shadow: 0 2px 12px #0002;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8.5pt;
          line-height: 1.3;
          position: relative;
          overflow: hidden;
        }

        .loa-header {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          min-height: 22mm;
          padding-bottom: 5mm;
        }

        .loa-header img {
          position: absolute;
          left: 0;
          top: 0;
          width: 24mm;
          height: 21mm;
          object-fit: contain;
        }

        .loa-company {
          text-align: center;
          width: 100%;
        }

        .loa-company h1 {
          font-size: 14pt;
          margin: 0 0 5px;
          font-weight: 700;
        }

        .loa-company p {
          margin: 2px 0;
          font-size: 7.3pt;
        }

        .loa-rule {
          border-top: 1.2px solid #222;
          margin: 2mm 0 5mm;
        }

        .loa-title {
          text-align: center;
          font-size: 14pt;
          font-weight: bold;
          margin: 4mm 0 5mm;
          text-decoration: underline;
        }

        .loa-date {
          text-align: right;
          margin-bottom: 4mm;
          font-size: 8.5pt;
        }

        .loa-section {
          margin-bottom: 3.5mm;
          break-inside: avoid;
        }

        .loa-section h3 {
          font-size: 9pt;
          margin: 0 0 2mm;
          font-weight: bold;
        }

        .loa-section-content {
          padding-left: 3mm;
        }

        .loa-detail {
          display: grid;
          grid-template-columns: 40mm minmax(0, 1fr);
          gap: 2mm;
          margin: 0 0 1.4mm;
          align-items: start;
        }

        .loa-detail-label {
          font-weight: 600;
        }

        .loa-detail-value {
          overflow-wrap: anywhere;
        }

        .loa-terms {
          margin: 1mm 0 3mm;
          padding-left: 6mm;
        }

        .loa-terms li {
          padding-left: 1mm;
          margin-bottom: 2mm;
          text-align: justify;
        }

        .loa-closing {
          margin-top: 3mm;
          text-align: justify;
        }

        .loa-signature {
          margin-top: 4mm;
          line-height: 1.4;
        }

        .loa-signature-space {
          height: 12mm;
        }

        .loa-acceptance {
          border-top: 1px solid #555;
          margin-top: 4mm;
          padding-top: 3mm;
          line-height: 1.5;
        }

        .loa-acceptance-line {
          display: flex;
          justify-content: space-between;
          gap: 5mm;
          margin-top: 7mm;
        }

        .loa-acceptance-line span {
          border-bottom: 1px solid #333;
          min-width: 40mm;
          display: inline-block;
        }

        @media screen and (max-width: 1000px) {
          .loa-layout {
            grid-template-columns: 1fr;
          }

          .loa-form {
            max-height: none;
          }
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .loa-app {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }

          .loa-toolbar,
          .loa-form,
          .loa-preview-heading {
            display: none !important;
          }

          .loa-layout {
            display: block !important;
          }

          .loa-preview-area,
          .loa-preview {
            display: block !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .loa-paper {
            width: 210mm !important;
            height: 297mm !important;
            min-width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            padding: 10mm 13mm 9mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          .loa-section,
          .loa-terms li {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="loa-toolbar">
        <div>
          <h2>Letter of Appointment Generator</h2>
          <p>Madihaa Company Pvt Ltd · HR Document Management</p>
        </div>

        <div className="loa-actions">
          <button
            className="loa-btn loa-btn-secondary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Hide Form" : "Edit Details"}
          </button>

          <button
            className="loa-btn loa-btn-primary"
            onClick={printLOA}
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="loa-layout">
        {showForm && (
          <aside className="loa-form">
            <h3>Select Candidate</h3>
            <label className="loa-field">
              <span>Recruitment Candidate</span>
              <select
                value={selectedCandidateId}
                onChange={(e) => handleCandidateSelect(e.target.value)}
              >
                <option value="">-- Select a candidate --</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.Name} ({candidate['EMP ID']})
                  </option>
                ))}
              </select>
            </label>

            <h3>Employer Details</h3>
            {field("employerName", "Company Name")}
            {field("registration", "Registration Number")}
            {field("employerAddress", "Company Address")}
            {field("employerContact", "Contact Details")}
            {field("country", "Country")}

            <h3>Employee Details</h3>
            {field("employeeName", "Full Name")}
            {field("permanentAddress", "Permanent Address")}
            {field("nationality", "Nationality")}
            {field("dateOfBirth", "Date of Birth")}
            {isMaldivian ? field("nationalId", "National ID") : field("passportNo", "Passport Number")}
            {field("contactNo", "Contact Number")}
            {field("emergencyContact", "Emergency Contact")}

            <h3>Employment Details</h3>
            {field("jobTitle", "Job Title / Occupation")}
            {field("businessActivity", "Business Activity")}
            {field("basicSalary", "Basic Salary")}
            {field("salaryCurrency", "Salary Currency")}
            {field("exchangeRate", "Exchange Rate")}
            {field("foodAccommodation", "Food & Accommodation")}
            {field("salaryPayment", "Date of Salary Payment")}
            {field("workSite", "Work Site")}
            {field("commencementDate", "Date of Commencement", "date")}
            {textarea("jobDescription", "Job Description", 3)}
            {field("workingHours", "Working Hours")}
            {field("contractDuration", "Work Status / Contract")}

            <h3>Letter Details</h3>
            {field("letterDate", "Letter Date", "date")}

            <h3>Probation Conditions</h3>
            {field("probationPeriod", "Probation Period")}
            {textarea("probationCondition", "Probation Condition", 5)}

            <h3>Annual Leave Conditions</h3>
            {textarea("annualLeaveCondition1", "Condition 1", 3)}
            {textarea("annualLeaveCondition2", "Condition 2", 3)}
            {textarea("annualLeaveCondition3", "Condition 3", 3)}

            <h3>Closing & Signature</h3>
            {textarea("closingMessage", "Closing Message", 3)}
            {field("signatoryName", "Managing Director Name")}
            {field("signatoryDesignation", "Designation")}
            {textarea("acceptanceText", "Employee Acceptance Text", 2)}
          </aside>
        )}

        <main className="loa-preview-area">
          <div className="loa-preview-heading">
            <strong>A4 Document Preview</strong>
            <span>210 × 297 mm · Portrait</span>
          </div>

          <div className="loa-preview">
            <article className="loa-paper">
              <header className="loa-header">
                <img
                  src="/Madihaa 2026 (1).png"
                  alt="Madihaa Logo"
                />

                <div className="loa-company">
                  <h1>MADIHAA COMPANY (PTE) LTD</h1>
                  <p>{data.employerAddress}</p>
                  <p>
                    Tel: 3328827 | Fax: 3313936 |
                    Email: madicom@dhivehinet.net.mv |
                    Web: www.madihaaa.com
                  </p>
                </div>
              </header>

              <div className="loa-rule" />

              <div className="loa-date">
                Date: {formatDate(data.letterDate)}
              </div>

              <h2 className="loa-title">
                LETTER OF APPOINTMENT
              </h2>

              {section(
                "1",
                "Detail of Employer",
                <>
                  {detail("Name", `${data.employerName} (${data.registration})`)}
                  {detail("Address", data.employerAddress)}
                  {detail("Contact Details", data.employerContact)}
                  {detail("Country of Origin", data.country)}
                </>
              )}

              {section(
                "2",
                "Detail of Employee",
                <>
                  {detail("Name", data.employeeName)}
                  {detail("Permanent Address", data.permanentAddress)}
                  {detail("Nationality", data.nationality)}
                  {detail("Date of Birth", data.dateOfBirth)}
                  {isMaldivian 
                    ? detail("National ID", data.nationalId)
                    : detail("Passport No.", data.passportNo)
                  }
                  {detail("Contact No.", data.contactNo)}
                  {detail("Emergency Contact", data.emergencyContact)}
                </>
              )}

              {section(
                "3",
                "Detail of Employment",
                <>
                  {detail("Job Title / Occupation", data.jobTitle)}
                  {detail("Business Activity", data.businessActivity)}
                  {detail("Basic Salary", money(data))}
                  {detail("Food & Accommodation", data.foodAccommodation)}
                  {detail("Date of Salary Payment", data.salaryPayment)}
                  {detail("Work Site", data.workSite)}
                  {detail("Date of Commencement", formatDate(data.commencementDate))}
                  {detail("Job Description", data.jobDescription)}
                  {detail("Working Hours", data.workingHours)}
                  {detail("Work Status", `Contract - ${data.contractDuration}`)}
                </>
              )}

              {section(
                "4",
                "Terms & Conditions",
                <>
                  <ol className="loa-terms">
                    <li>
                      During the initial {data.probationPeriod} probation period,
                      {` ${data.probationCondition}`}
                    </li>
                    <li>{data.annualLeaveCondition1}</li>
                    <li>{data.annualLeaveCondition2}</li>
                    <li>{data.annualLeaveCondition3}</li>
                  </ol>
                </>
              )}

              <div className="loa-closing">
                {data.closingMessage}
              </div>

              <div className="loa-signature">
                Regards,
                <div className="loa-signature-space" />
                <strong>{data.signatoryName || "________________________"}</strong>
                <div>{data.signatoryDesignation}</div>
                <div>{data.employerName}</div>
              </div>

              <div className="loa-acceptance">
                <strong>EMPLOYEE ACCEPTANCE</strong>
                <p>{data.acceptanceText}</p>

                <div className="loa-acceptance-line">
                  <div>
                    Name: <span />
                  </div>
                  <div>
                    Signature: <span />
                  </div>
                </div>

                <div className="loa-acceptance-line">
                  <div>
                    Date: <span />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </main>
      </div>
    </div>
  );
}
