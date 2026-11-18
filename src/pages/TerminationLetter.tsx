import { useState } from "react";
import "./TerminationLetter.css";

type Language = "en" | "dv" | "both";

interface TerminationData {
  employeeName: string;
  nationalId: string;
  employeeId: string;
  department: string;
  designation: string;
  letterDate: string;
  effectiveDate: string;
  reason: string;
  managerName: string;
  managerDesignation: string;
  companyAddress: string;
  companyRegNo: string;
}

interface Props {
  initialData?: Partial<TerminationData>;
  onClose?: () => void;
}

const today = new Date().toISOString().split("T")[0];

const defaultData: TerminationData = {
  employeeName: "",
  nationalId: "",
  employeeId: "",
  department: "",
  designation: "",
  letterDate: today,
  effectiveDate: today,
  reason:
    "Failure to report to work despite repeated instructions and opportunities provided by the company.",
  managerName: "Iqbal Mohamed",
  managerDesignation: "General Manager",
  companyAddress: "M. Madihaa, Malé, Republic of Maldives",
  companyRegNo: "C14/1985",
};

const formatDate = (value: string) => {
  if (!value) return "_______________";

  return new Date(value + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const translations = {
  en: {
    subject: "Subject: Termination of Employment",
    greeting: "Dear",
    opening:
      "Greetings. We are writing to formally notify you regarding your employment with Madihaa Company Pvt. Ltd., registered under Company Registration No. {regNo}.",
    paragraph1:
      "Despite repeated instructions to report to work and the opportunities provided to you, you have failed to attend work and take responsibility for your assigned duties. Furthermore, you have not submitted any acceptable explanation regarding your absence from work.",
    paragraph2:
      "Reliability and regular attendance are essential requirements for the proper operation of the company. After carefully reviewing this matter, the management of the company has decided to terminate your employment due to your failure to attend work and fulfil your employment responsibilities.",
    paragraph3:
      "This termination decision will take effect from {date}.",
    paragraph4:
      "If you require any further information regarding this decision, please contact the HR and Administration Department. Furthermore, in accordance with the company's salary payment procedures, any salary and other benefits due to you up to your last working day will be deposited into your bank account on the designated salary payment date.",
    closing: "Yours sincerely,",
    date: "Date:",
    employeeId: "Employee ID:",
    nationalId: "National ID:",
    department: "Department:",
    designation: "Designation:",
    reason: "Reason for Termination:",
  },
  dv: {
    subject: "މައުޟޫޢު: ވަޒީފާއިން ވަކިކުރުމާބެހޭ",
    greeting: "އަލްފާޟިލް / އަލްފާޟިލާ",
    opening:
      "ވެދުން ސަލާމަށްފަހު ދަންނަވަމެވެ. މި ސިޓީއަކީ މަޑިހާ ކޮމްޕެނީ ޕްރައިވެޓް ލިމިޓެޑް، ރަޖިސްޓްރީ ނަންބަރު {regNo} ގައި ރަޖިސްޓަރީކުރެވިފައިވާ މި ކުންފުނީގައި ތިޔަ ފަރާތުން އަދާކުރަމުންދާ ވަޒީފާގެ ހާލަތާ ގުޅޭގޮތުން ރަސްމީކޮށް އެންގުމަށް ފޮނުވާ ސިޓީއެކެވެ.",
    paragraph1:
      "ވަޒީފާއަށް ހާޒިރުވުމަށް ތަކުރާރުކޮށް އެންގިފައިވާނަމަވެސް، އަދި އެކަމަށް ގިނަ ފުރުޞަތުތަކެއް ދެވިފައިވާނަމަވެސް، ތިޔަ ފަރާތުން މަސައްކަތަށް ހާޒިރުނުވެ، އަދި ހަވާލުވެފައިވާ ޒިންމާތައް އަދާނުކުރެވުނެވެ. މީގެ އިތުރުން، ވަޒީފާއަށް ހާޒިރުނުވާ ސަބަބާ ގުޅޭގޮތުން ޤަބޫލުކުރެވޭ އުޒުރެއް ހުށަހަޅާފައެއް ނުވެއެވެ.",
    paragraph2:
      "ކުންފުނީގެ މަސައްކަތްތައް ހިންގުމުގައި އިތުބާރާއި، ގަވާއިދުން ވަޒީފާއަށް ހާޒިރުވުމަކީ މުހިންމު ކަންކަމެވެ. މި މައްސަލަ ފުރިހަމައަށް ބެލުމަށްފަހު، ވަޒީފާއަށް ހާޒިރުނުވުމާއި ވަޒީފާގެ ޒިންމާތައް އަދާނުކުރުމުގެ ސަބަބުން، ތިޔަ ފަރާތުގެ ވަޒީފާ ނިމުމަށް ކުންފުނީގެ މެނޭޖްމަންޓުން ނިންމިއެވެ.",
    paragraph3:
      "މި ނިންމުން އަމަލުކުރަން ފަށާނީ {date} އިން ފެށިގެންނެވެ.",
    paragraph4:
      "މި ނިންމުމާ ގުޅޭގޮތުން އިތުރު މަޢުލޫމާތު ބޭނުންފުޅުވާނަމަ، އެޗްއާރް އަދި އެޑްމިނިސްޓްރޭޝަން ޑިޕާޓްމަންޓާ ގުޅުއްވުން އެދެމެވެ. އަދި ކުންފުނީގެ މުސާރަ ދިނުމުގެ އުސޫލާ އެއްގޮތްވާ ގޮތުގެ މަތިން، މިއަދާ ހަމައަށް ތިޔަ ބޭފުޅާއަށް ޙައްޤުވާ މުސާރައާއި އެހެނިހެން އިނާޔަތްތައް، ކަނޑައެޅިފައިވާ މުސާރަ ދޭ ދުވަހު ތިޔަ ބޭފުޅާގެ ބޭންކް އެކައުންޓަށް ޖަމާކުރެވޭނެކަން ދަންނަވަމެވެ.",
    closing: "އިޚްތިރާމް ޤަބޫލުކުރެއްވުން އެދެމެވެ.",
    date: "ތާރީޚް:",
    employeeId: "މުވައްޒަފު އައިޑީ:",
    nationalId: "ދ.ރ.އ.ކ:",
    department: "ޑިޕާޓްމަންޓް:",
    designation: "މަޤާމު:",
    reason: "ވަޒީފާ ނިމުމުގެ ސަބަބު:",
  },
};

export default function TerminationLetter({
  initialData,
  onClose,
}: Props) {
  const [data, setData] = useState<TerminationData>({
    ...defaultData,
    ...initialData,
  });

  const [language, setLanguage] = useState<Language>("en");
  const [showDetails, setShowDetails] = useState(true);

  const update = (key: keyof TerminationData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const replaceValues = (text: string) =>
    text
      .replace("{regNo}", data.companyRegNo)
      .replace("{date}", formatDate(data.effectiveDate));

  const printLetter = () => {
    window.print();
  };

  const renderLetter = (lang: "en" | "dv") => {
    const t = translations[lang];
    const isDhivehi = lang === "dv";

    return (
      <section
        className={`letter-page ${isDhivehi ? "dhivehi" : "english"}`}
        dir={isDhivehi ? "rtl" : "ltr"}
        lang={isDhivehi ? "dv" : "en"}
        key={lang}
      >
        <header className="letter-header">
          <div className="letter-logo">
            <img
              src="/Madihaa 2026 (1).png"
              alt="Madihaa Company"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          <div className="company-heading">
            <h1>
              {isDhivehi
                ? "މަޑިހާ ކޮމްޕެނީ ޕްރައިވެޓް ލިމިޓެޑް"
                : "MADIHAA COMPANY (PTE) LTD"}
            </h1>
            <p>
              {isDhivehi
                ? "މާލެ، ދިވެހިރާއްޖެ"
                : data.companyAddress}
            </p>
            <p className="contact-line">
              Tel: 3328827 | Fax: 3313936 | Email:
              madicom@dhivehinet.net.mv | Web: www.madihaaa.com
            </p>
          </div>
        </header>

        <div className="letter-rule" />

        <div className="letter-date">
          {t.date} {formatDate(data.letterDate)}
        </div>

        <h2 className="letter-subject">{t.subject}</h2>

        <div className="employee-address">
          <strong>{data.employeeName || "_______________"}</strong>
          <div>
            {t.nationalId} {data.nationalId || "_______________"}
          </div>
          <div>
            {t.employeeId} {data.employeeId || "_______________"}
          </div>
        </div>

        <p className="letter-greeting">
          {t.greeting} {data.employeeName || "_______________"},
        </p>

        <div className="employee-meta">
          {data.department && (
            <p>{t.department} {data.department}</p>
          )}
          {data.designation && (
            <p>{t.designation} {data.designation}</p>
          )}
        </div>

        <div className="letter-body">
          <p>{replaceValues(t.opening)}</p>

          <p>{replaceValues(t.paragraph1)}</p>

          {data.reason && (
            <div className="reason-block">
              <strong>{t.reason}</strong>
              <p>{data.reason}</p>
            </div>
          )}

          <p>{replaceValues(t.paragraph2)}</p>

          <p>{replaceValues(t.paragraph3)}</p>

          <p>{replaceValues(t.paragraph4)}</p>
        </div>

        <div className="letter-closing">
          <p>{t.closing}</p>

          <div className="signature-space" />

          <strong>{data.managerName}</strong>
          <div>{data.managerDesignation}</div>
          <div>Madihaa Company (Pte) Ltd</div>
        </div>

        <footer className="letter-footer">
          <span>
            Madihaa Company (Pte) Ltd | {data.companyRegNo}
          </span>
        </footer>
      </section>
    );
  };

  return (
    <div className="termination-container">
      <div className="termination-toolbar">
        <div>
          <h2>Termination Letter Generator</h2>
          <p>Create professional English and Dhivehi letters</p>
        </div>

        <div className="toolbar-actions">
          {onClose && (
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          )}

          <button className="btn-primary" onClick={printLetter}>
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="generator-layout">
        {showDetails && (
          <aside className="letter-form">
            <h3>Employee & Letter Details</h3>

            {(
              [
                ["employeeName", "Employee Name"],
                ["nationalId", "National ID"],
                ["employeeId", "Employee ID"],
                ["department", "Department"],
                ["designation", "Designation"],
              ] as [keyof TerminationData, string][]
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  value={data[key]}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={label}
                />
              </label>
            ))}

            <label>
              Letter Date
              <input
                type="date"
                value={data.letterDate}
                onChange={(e) => update("letterDate", e.target.value)}
              />
            </label>

            <label>
              Termination Effective Date
              <input
                type="date"
                value={data.effectiveDate}
                onChange={(e) => update("effectiveDate", e.target.value)}
              />
            </label>

            <label>
              Reason for Termination
              <textarea
                rows={4}
                value={data.reason}
                onChange={(e) => update("reason", e.target.value)}
              />
            </label>

            <label>
              General Manager Name
              <input
                value={data.managerName}
                onChange={(e) => update("managerName", e.target.value)}
              />
            </label>

            <label>
              Manager Designation
              <input
                value={data.managerDesignation}
                onChange={(e) => update("managerDesignation", e.target.value)}
              />
            </label>

            <label>
              Company Registration Number
              <input
                value={data.companyRegNo}
                onChange={(e) => update("companyRegNo", e.target.value)}
              />
            </label>

            <button
              className="btn-secondary full-width"
              onClick={() => setShowDetails(false)}
            >
              Hide Details
            </button>
          </aside>
        )}

        <main className="letter-preview-area">
          <div className="preview-toolbar">
            <div className="language-selector">
              {(
                [
                  ["en", "English"],
                  ["dv", "Dhivehi"],
                  ["both", "Both Languages"],
                ] as [Language, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  className={language === value ? "selected" : ""}
                  onClick={() => setLanguage(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {!showDetails && (
              <button
                className="btn-secondary"
                onClick={() => setShowDetails(true)}
              >
                Edit Details
              </button>
            )}
          </div>

          <div className="letter-preview">
            {language === "en" && renderLetter("en")}
            {language === "dv" && renderLetter("dv")}
            {language === "both" && (
              <>
                {renderLetter("en")}
                {renderLetter("dv")}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
