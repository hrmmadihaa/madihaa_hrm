import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSearchParams } from 'react-router-dom';

type Candidate = {
  id: string;
  Name: string;
  'EMP ID': string;
  POSITION?: string;
  department?: string;
  employment_type?: string;
  'D.O.J'?: string;
  salary?: string;
  working_hours?: string;
  work_location?: string;
  reporting_to?: string;
};

export default function OfferLetter() {
  const [searchParams] = useSearchParams();
  const candidateIdFromUrl = searchParams.get('candidateId');
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  const candidate = candidates.find(
    (c) => c.id === selectedId
  );

  const [details, setDetails] = useState({
    letterDate: new Date().toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }),
    position: "",
    department: "",
    employmentType: "",
    startDate: "",
    salary: "",
    workingHours: "",
    workLocation: "",
    reportingTo: "",
    signatory: "Moosa Ahmed",
    designation: "Chairman",
  });

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const candidatesQuery = query(collection(db, 'recruitment_candidates'), orderBy('created_date', 'desc'));
      const candidatesSnapshot = await getDocs(candidatesQuery);
      const candidatesData = candidatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Candidate));
      setCandidates(candidatesData);
      
      // If candidateId is in URL, select that candidate
      if (candidateIdFromUrl && candidatesData.find(c => c.id === candidateIdFromUrl)) {
        setSelectedId(candidateIdFromUrl);
        const selectedCandidate = candidatesData.find(c => c.id === candidateIdFromUrl);
        if (selectedCandidate) {
          setDetails(prev => ({
            ...prev,
            position: selectedCandidate.POSITION || "",
            department: selectedCandidate.department || "",
            employmentType: selectedCandidate.employment_type || "Probation",
            startDate: selectedCandidate['D.O.J'] ? new Date(selectedCandidate['D.O.J']).toLocaleDateString('en-GB', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            }) : "",
            salary: selectedCandidate.salary || "",
            workingHours: selectedCandidate.working_hours || "9:00 to 17:30",
            workLocation: selectedCandidate.work_location || "Head Office",
            reportingTo: selectedCandidate.reporting_to || "Head of Accounts",
          }));
        }
      } else if (candidatesData.length > 0) {
        // Otherwise select the first candidate
        setSelectedId(candidatesData[0].id);
        const firstCandidate = candidatesData[0];
        setDetails(prev => ({
          ...prev,
          position: firstCandidate.POSITION || "",
          department: firstCandidate.department || "",
          employmentType: firstCandidate.employment_type || "Probation",
          startDate: firstCandidate['D.O.J'] ? new Date(firstCandidate['D.O.J']).toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }) : "",
          salary: firstCandidate.salary || "",
          workingHours: firstCandidate.working_hours || "9:00 to 17:30",
          workLocation: firstCandidate.work_location || "Head Office",
          reportingTo: firstCandidate.reporting_to || "Head of Accounts",
        }));
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateChange = (candidateId: string) => {
    setSelectedId(candidateId);
    const selectedCandidate = candidates.find(c => c.id === candidateId);
    if (selectedCandidate) {
      setDetails(prev => ({
        ...prev,
        position: selectedCandidate.POSITION || "",
        department: selectedCandidate.department || "",
        employmentType: selectedCandidate.employment_type || "Probation",
        startDate: selectedCandidate['D.O.J'] ? new Date(selectedCandidate['D.O.J']).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }) : "",
        salary: selectedCandidate.salary || "",
        workingHours: selectedCandidate.working_hours || "9:00 to 17:30",
        workLocation: selectedCandidate.work_location || "Head Office",
        reportingTo: selectedCandidate.reporting_to || "Head of Accounts",
      }));
    }
  };

  const update = (key: keyof typeof details, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handlePrint = () => {
    if (!candidate) return;
    window.print();
  };

  const handleSaveToFirestore = async () => {
    if (!candidate) return;
    
    const offerLetterHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
      max-width: 210mm;
      margin: 0 auto;
      padding: 12mm 17mm 13mm;
      background: white;
      font-size: 9.5pt;
    }
    .letterhead {
      min-height: 25mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .company-logo {
      width: 120px;
      height: 120px;
      object-fit: contain;
    }
    .brand h1 {
      margin: 0;
      font-size: 18px;
      letter-spacing: 1.5px;
      color: #172b4d;
    }
    .brand p {
      margin: 3px 0 0;
      font-size: 9px;
      letter-spacing: 3px;
      color: #555;
    }
    .company-contact {
      text-align: right;
      font-size: 8.5pt;
      line-height: 1.5;
      color: #444;
    }
    .company-contact p {
      margin: 0;
    }
    .header-line {
      height: 2px;
      background: #172b4d;
      margin: 3mm 0 7mm;
    }
    .letter-date {
      text-align: right;
      font-size: 9.5pt;
      margin-bottom: 7mm;
    }
    .recipient {
      font-size: 9.5pt;
      line-height: 1.4;
      margin-bottom: 5mm;
    }
    .recipient p {
      margin: 1px 0;
    }
    .subject {
      font-size: 10pt;
      margin: 0 0 5mm;
      text-decoration: underline;
    }
    .letter-body {
      font-size: 9.5pt;
      line-height: 1.32;
    }
    .letter-body p {
      margin: 0 0 3.5mm;
    }
    .employment-details {
      margin: 2mm 0 4mm 4mm;
    }
    .employment-details p {
      margin: 0 0 1.5mm;
    }
    .signature {
      margin-top: 3mm;
      line-height: 1.3;
    }
    .signature p {
      margin: 0 0 1mm;
    }
    .signature-space {
      height: 11mm;
    }
    .acceptance {
      border-top: 1px solid #888;
      margin-top: auto;
      padding-top: 4mm;
      font-size: 9pt;
      line-height: 1.3;
    }
    .acceptance-title {
      text-align: center;
      font-size: 10pt;
      font-weight: bold;
      letter-spacing: 1px;
      margin-bottom: 3mm;
    }
    .acceptance > p {
      margin: 0 0 5mm;
    }
    .acceptance-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20mm;
    }
    .acceptance-signatures > div {
      display: flex;
      align-items: flex-end;
      gap: 5px;
    }
    .write-line {
      border-bottom: 1px solid #222;
      flex: 1;
      height: 8mm;
    }
    .letter-footer {
      border-top: 1px solid #172b4d;
      margin-top: 7mm;
      padding-top: 2mm;
      text-align: center;
      font-size: 7pt;
      letter-spacing: 1.5px;
      color: #555;
    }
  </style>
</head>
<body>
  <header class="letterhead">
    <div class="brand">
      <img src="/Madihaa 2026 (1).png" alt="Madihaa Company Logo" class="company-logo" />
      <div>
        <h1>MADIHAA COMPANY</h1>
        <p>PRIVATE LIMITED</p>
      </div>
    </div>
    <div class="company-contact">
      <p>M. Madihaa, Lainoofaru Magu</p>
      <p>Malé, Republic of Maldives</p>
      <p>admin@madihaa.mv</p>
      <p>www.madihaa.mv</p>
    </div>
  </header>
  <div class="header-line" />
  <div class="letter-date">${details.letterDate}</div>
  <div class="recipient">
    <strong>To:</strong>
    <p>${candidate.Name}</p>
    <p>National ID: ${candidate['EMP ID']}</p>
  </div>
  <h3 class="subject">Subject: Offer of Employment</h3>
  <main class="letter-body">
    <p>Dear ${candidate.Name},</p>
    <p>We are pleased to offer you the position of <strong>${details.position}</strong> at Madihaa Company Pvt Ltd.</p>
    <p>The terms and conditions of your employment are as follows:</p>
    <div class="employment-details">
      <p><strong>Position:</strong> ${details.position}</p>
      <p><strong>Department:</strong> ${details.department}</p>
      <p><strong>Employment Type:</strong> ${details.employmentType}</p>
      <p><strong>Start Date:</strong> ${details.startDate}</p>
      <p><strong>Salary:</strong> MVR ${details.salary}</p>
      <p><strong>Working Hours:</strong> ${details.workingHours}</p>
      <p><strong>Work Location:</strong> ${details.workLocation}</p>
      <p><strong>Reporting To:</strong> ${details.reportingTo}</p>
    </div>
    <p>Your employment will be subject to the company's policies, procedures, and applicable employment laws.</p>
    <p>Please confirm your acceptance of this offer by signing and returning a copy of this letter.</p>
    <p>We look forward to welcoming you to our team and wish you success in your new role.</p>
    <div class="signature">
      <p>Sincerely,</p>
      <div class="signature-space" />
      <strong>${details.signatory}</strong>
      <p>${details.designation}</p>
      <p>Madihaa Company Pvt Ltd</p>
    </div>
  </main>
  <section class="acceptance">
    <div class="acceptance-title">ACCEPTANCE OF OFFER</div>
    <p>I, <strong>${candidate.Name}</strong>, accept the employment offer and agree to the terms and conditions stated above.</p>
    <div class="acceptance-signatures">
      <div>
        <span>Signature:</span>
        <div class="write-line" />
      </div>
      <div>
        <span>Date:</span>
        <div class="write-line" />
      </div>
    </div>
  </section>
  <footer class="letter-footer">MADIHAA COMPANY PVT LTD</footer>
</body>
</html>
    `;

    try {
      await updateDoc(doc(db, 'recruitment_candidates', candidate.id), {
        offer_letter_html: offerLetterHTML,
        offer_letter_date: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });
      alert('Offer letter saved to Firestore successfully!');
    } catch (error) {
      console.error('Error saving offer letter:', error);
      alert('Failed to save offer letter');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading candidates...</div>;
  }

  return (
    <div className="offer-builder">

      {/* EDITING PANEL - NOT PRINTED */}
      <div className="editor no-print">
        <div className="editor-heading">
          <div>
            <h2>Employment Offer Letter</h2>
            <p>Prepare and generate an official offer letter.</p>
          </div>
          <div className="button-group">
            <button onClick={handleSaveToFirestore} className="save-button">
              Save to Firestore
            </button>
            <button onClick={handlePrint} className="print-button">
              Print / Save PDF
            </button>
          </div>
        </div>

        <div className="editor-grid">
          <div className="field full">
            <label>Select Candidate</label>
            <select
              value={selectedId}
              onChange={(e) => handleCandidateChange(e.target.value)}
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.Name} — {c['EMP ID']}
                </option>
              ))}
            </select>
          </div>

          {(
            [
              ["letterDate", "Letter Date"],
              ["position", "Position"],
              ["department", "Department"],
              ["employmentType", "Employment Type"],
              ["startDate", "Employment Start Date"],
              ["salary", "Monthly Salary (MVR)"],
              ["workingHours", "Working Hours"],
              ["workLocation", "Work Location"],
              ["reportingTo", "Reporting To"],
              ["signatory", "Authorized Signatory"],
              ["designation", "Signatory Designation"],
            ] as [keyof typeof details, string][]
          ).map(([key, label]) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <input
                value={details[key]}
                onChange={(e) => update(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* A4 OFFER LETTER */}
      {candidate && (
        <div className="offer-page" id="offer-letter">

          {/* COMPANY LETTERHEAD */}
          <header className="letterhead">
            <div className="brand">
              <img 
                src="/Madihaa 2026 (1).png" 
                alt="Madihaa Company Logo" 
                className="company-logo"
              />
              <div>
                <h1>MADIHAA COMPANY</h1>
                <p>PRIVATE LIMITED</p>
              </div>
            </div>

            <div className="company-contact">
              <p>M. Madihaa, Lainoofaru Magu</p>
              <p>Malé, Republic of Maldives</p>
              <p>admin@madihaa.mv</p>
              <p>www.madihaa.mv</p>
            </div>
          </header>

          <div className="header-line" />

          {/* LETTER DATE */}
          <div className="letter-date">
            {details.letterDate}
          </div>

          {/* CANDIDATE INFORMATION */}
          <div className="recipient">
            <strong>To:</strong>
            <p>{candidate.Name}</p>
            <p>National ID: {candidate['EMP ID']}</p>
          </div>

          {/* SUBJECT */}
          <h3 className="subject">
            Subject: Offer of Employment
          </h3>

          {/* LETTER BODY */}
          <main className="letter-body">

            <p>Dear {candidate.Name},</p>

            <p>
              We are pleased to offer you the position of{" "}
              <strong>{details.position}</strong> at
              Madihaa Company Pvt Ltd.
            </p>

            <p>
              The terms and conditions of your employment
              are as follows:
            </p>

            <div className="employment-details">
              <p>
                <strong>Position:</strong> {details.position}
              </p>
              <p>
                <strong>Department:</strong> {details.department}
              </p>
              <p>
                <strong>Employment Type:</strong>{" "}
                {details.employmentType}
              </p>
              <p>
                <strong>Start Date:</strong> {details.startDate}
              </p>
              <p>
                <strong>Salary:</strong> MVR {details.salary}
              </p>
              <p>
                <strong>Working Hours:</strong>{" "}
                {details.workingHours}
              </p>
              <p>
                <strong>Work Location:</strong>{" "}
                {details.workLocation}
              </p>
              <p>
                <strong>Reporting To:</strong>{" "}
                {details.reportingTo}
              </p>
            </div>

            <p>
              Your employment will be subject to the
              company's policies, procedures, and
              applicable employment laws.
            </p>

            <p>
              Please confirm your acceptance of this offer
              by signing and returning a copy of this letter.
            </p>

            <p>
              We look forward to welcoming you to our team
              and wish you success in your new role.
            </p>

            <div className="signature">
              <p>Sincerely,</p>
              <div className="signature-space" />
              <strong>{details.signatory}</strong>
              <p>{details.designation}</p>
              <p>Madihaa Company Pvt Ltd</p>
            </div>
          </main>

          {/* ACCEPTANCE SECTION */}
          <section className="acceptance">
            <div className="acceptance-title">
              ACCEPTANCE OF OFFER
            </div>

            <p>
              I, <strong>{candidate.Name}</strong>, accept
              the employment offer and agree to the terms
              and conditions stated above.
            </p>

            <div className="acceptance-signatures">
              <div>
                <span>Signature:</span>
                <div className="write-line" />
              </div>

              <div>
                <span>Date:</span>
                <div className="write-line" />
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="letter-footer">
            MADIHAA COMPANY PVT LTD
          </footer>

        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }

        .offer-builder {
          background: #f1f3f6;
          min-height: 100vh;
          padding: 24px;
          color: #20242c;
          font-family: Arial, Helvetica, sans-serif;
        }

        .editor {
          max-width: 1050px;
          margin: 0 auto 28px;
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 3px 15px rgba(0,0,0,.06);
        }

        .editor-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
        }

        .editor-heading h2 {
          margin: 0 0 5px;
          font-size: 22px;
        }

        .editor-heading p {
          margin: 0;
          color: #737b88;
          font-size: 13px;
        }

        .button-group {
          display: flex;
          gap: 10px;
        }

        .editor-heading button {
          background: #172b4d;
          color: white;
          border: 0;
          padding: 12px 20px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 600;
        }

        .save-button {
          background: #27ae60 !important;
        }

        .print-button {
          background: #172b4d !important;
        }

        .editor-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field label {
          font-size: 12px;
          font-weight: 600;
          color: #505967;
        }

        .field input,
        .field select {
          width: 100%;
          height: 40px;
          padding: 8px 10px;
          border: 1px solid #d9dee7;
          border-radius: 6px;
          background: white;
          font-size: 13px;
        }

        /* A4 PAGE PREVIEW */

        .offer-page {
          position: relative;
          width: 210mm;
          height: 297mm;
          padding: 12mm 17mm 13mm;
          margin: 0 auto;
          background: white;
          color: #111;
          box-shadow: 0 5px 25px rgba(0,0,0,.12);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          font-family: Arial, Helvetica, sans-serif;
        }

        .letterhead {
          min-height: 25mm;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .company-logo {
          width: 120px;
          height: 120px;
          object-fit: contain;
        }

        .brand h1 {
          margin: 0;
          font-size: 18px;
          letter-spacing: 1.5px;
          color: #172b4d;
        }

        .brand p {
          margin: 3px 0 0;
          font-size: 9px;
          letter-spacing: 3px;
          color: #555;
        }

        .company-contact {
          text-align: right;
          font-size: 8.5pt;
          line-height: 1.5;
          color: #444;
        }

        .company-contact p {
          margin: 0;
        }

        .header-line {
          height: 2px;
          background: #172b4d;
          margin: 3mm 0 7mm;
          flex-shrink: 0;
        }

        .letter-date {
          text-align: right;
          font-size: 9.5pt;
          margin-bottom: 7mm;
        }

        .recipient {
          font-size: 9.5pt;
          line-height: 1.4;
          margin-bottom: 5mm;
        }

        .recipient p {
          margin: 1px 0;
        }

        .subject {
          font-size: 10pt;
          margin: 0 0 5mm;
          text-decoration: underline;
        }

        .letter-body {
          font-size: 9.5pt;
          line-height: 1.32;
        }

        .letter-body p {
          margin: 0 0 3.5mm;
        }

        .employment-details {
          margin: 2mm 0 4mm 4mm;
        }

        .employment-details p {
          margin: 0 0 1.5mm;
        }

        .signature {
          margin-top: 3mm;
          line-height: 1.3;
        }

        .signature p {
          margin: 0 0 1mm;
        }

        .signature-space {
          height: 11mm;
        }

        .acceptance {
          border-top: 1px solid #888;
          margin-top: auto;
          padding-top: 4mm;
          font-size: 9pt;
          line-height: 1.3;
        }

        .acceptance-title {
          text-align: center;
          font-size: 10pt;
          font-weight: bold;
          letter-spacing: 1px;
          margin-bottom: 3mm;
        }

        .acceptance > p {
          margin: 0 0 5mm;
        }

        .acceptance-signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20mm;
        }

        .acceptance-signatures > div {
          display: flex;
          align-items: flex-end;
          gap: 5px;
        }

        .write-line {
          border-bottom: 1px solid #222;
          flex: 1;
          height: 8mm;
        }

        .letter-footer {
          border-top: 1px solid #172b4d;
          margin-top: 7mm;
          padding-top: 2mm;
          text-align: center;
          font-size: 7pt;
          letter-spacing: 1.5px;
          color: #555;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .offer-builder {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            min-height: 0 !important;
          }

          .offer-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 12mm 17mm 13mm !important;
            box-shadow: none !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            break-after: avoid-page !important;
          }
        }

        @media screen and (max-width: 850px) {
          .offer-page {
            transform-origin: top left;
            transform: scale(.75);
            margin-bottom: -74mm;
          }

          .editor-grid {
            grid-template-columns: 1fr;
          }

          .editor-heading {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
