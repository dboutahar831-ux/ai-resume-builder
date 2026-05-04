const fields = {
  software: {
    keywords: ['software', 'developer', 'engineer', 'programming', 'coding', 'web', 'frontend', 'backend', 'fullstack', 'devops', 'data', 'mobile', 'app', 'tech'],
    skills: {
      entry:  ['JavaScript', 'HTML/CSS', 'React', 'Git', 'Node.js', 'Python', 'SQL', 'REST APIs', 'Problem Solving', 'Agile'],
      junior: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Git', 'REST APIs', 'Docker', 'Unit Testing', 'Agile/Scrum'],
      mid:    ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'CI/CD', 'Microservices', 'GraphQL', 'Redis', 'System Design'],
      senior: ['System Architecture', 'TypeScript', 'React', 'Node.js', 'AWS/GCP', 'Kubernetes', 'Microservices', 'PostgreSQL', 'Redis', 'CI/CD', 'Team Leadership', 'Code Review'],
      staff:  ['System Architecture', 'Technical Strategy', 'AWS/GCP', 'Kubernetes', 'Microservices', 'PostgreSQL', 'Redis', 'Team Leadership', 'Mentorship', 'Cross-functional Collaboration', 'OKRs', 'Roadmap Planning'],
    },
    bullets: {
      entry:  '• Built and maintained web application features using React and Node.js, reducing page load time by 20%\n• Collaborated with senior engineers on RESTful API design and database schema improvements\n• Wrote unit tests achieving 80%+ code coverage across assigned modules',
      junior: '• Developed and shipped 3 customer-facing features using React and TypeScript, improving user engagement by 25%\n• Optimized SQL queries reducing average API response time from 800ms to 180ms\n• Participated in code reviews and contributed to team coding standards documentation',
      mid:    '• Led development of a microservices migration reducing deployment time by 60% and improving system reliability to 99.9% uptime\n• Architected and implemented a caching layer using Redis that cut database load by 45%\n• Mentored 2 junior developers and conducted weekly code reviews across a 6-person team',
      senior: '• Architected a scalable event-driven system handling 2M+ daily transactions with zero downtime during peak loads\n• Led a team of 8 engineers to deliver a platform rewrite 2 weeks ahead of schedule, reducing infrastructure costs by $120K/year\n• Established engineering best practices including CI/CD pipelines, automated testing standards, and incident response playbooks',
      staff:  '• Defined and executed a 12-month technical roadmap aligning 3 engineering teams around a unified platform strategy\n• Drove adoption of microservices architecture across 5 product squads, reducing release cycle from 3 weeks to 2 days\n• Grew engineering org from 12 to 28 engineers while maintaining team velocity and culture through structured onboarding programs',
    },
  },
  finance: {
    keywords: ['finance', 'accounting', 'financial', 'analyst', 'investment', 'banking', 'audit', 'tax', 'budget', 'cfo', 'controller'],
    skills: {
      entry:  ['Microsoft Excel', 'Financial Modeling', 'QuickBooks', 'Data Analysis', 'GAAP', 'Budgeting', 'PowerPoint', 'SQL', 'Attention to Detail', 'Communication'],
      junior: ['Financial Modeling', 'Excel (Advanced)', 'GAAP/IFRS', 'QuickBooks', 'Budget Analysis', 'Variance Reporting', 'PowerPoint', 'SQL', 'Forecasting', 'Accounts Reconciliation'],
      mid:    ['Financial Planning & Analysis', 'Excel (Advanced)', 'GAAP/IFRS', 'ERP Systems (SAP/Oracle)', 'Budget Management', 'Forecasting', 'SQL', 'Power BI', 'Risk Assessment', 'Stakeholder Reporting'],
      senior: ['Strategic Financial Planning', 'FP&A', 'ERP Systems', 'GAAP/IFRS', 'M&A Analysis', 'Risk Management', 'Power BI', 'Executive Reporting', 'Team Leadership', 'Investor Relations'],
      staff:  ['Corporate Finance Strategy', 'M&A', 'Investor Relations', 'Capital Allocation', 'Risk Management', 'ERP Systems', 'Executive Communication', 'Board Reporting', 'Regulatory Compliance', 'Team Leadership'],
    },
    bullets: {
      entry:  '• Assisted in preparing monthly financial statements and reconciliations across 5 cost centers with 99% accuracy\n• Supported annual audit process by organizing documentation and responding to 120+ auditor requests\n• Built Excel dashboards to track departmental spend, reducing reporting time by 30%',
      junior: '• Managed accounts payable/receivable cycle for a $12M portfolio with a 98% on-time payment rate\n• Produced monthly variance reports highlighting $340K in cost-saving opportunities over Q3\n• Streamlined expense reporting process reducing processing time from 5 days to 1 day',
      mid:    '• Led annual budgeting process for a $45M operating budget across 7 business units, delivering plan 3 weeks ahead of deadline\n• Built a dynamic 3-statement financial model that improved forecast accuracy from 78% to 93%\n• Identified $1.2M in unnecessary vendor spend through spend analysis, achieving full savings within 6 months',
      senior: '• Directed FP&A function for a $280M revenue business, partnering with C-suite on strategic planning and capital allocation\n• Spearheaded financial due diligence for 2 acquisitions totaling $95M, delivering integration financial models on time\n• Reduced monthly close cycle from 12 days to 5 days by redesigning workflows and implementing ERP automation',
      staff:  '• Oversaw $500M+ balance sheet and led treasury strategy generating $8M incremental return through optimized cash deployment\n• Structured and closed $150M credit facility, securing best-in-class terms saving $4M annually in interest costs\n• Built and scaled finance team from 6 to 22 professionals aligned to company\'s 3x growth trajectory',
    },
  },
  marketing: {
    keywords: ['marketing', 'brand', 'digital', 'content', 'seo', 'social media', 'growth', 'campaign', 'advertising', 'communications', 'pr'],
    skills: {
      entry:  ['Social Media Management', 'Content Writing', 'Canva', 'Google Analytics', 'SEO Basics', 'Email Marketing', 'Copywriting', 'WordPress', 'Facebook Ads', 'Attention to Detail'],
      junior: ['Social Media Marketing', 'Content Strategy', 'Google Analytics', 'SEO/SEM', 'Email Marketing (Mailchimp)', 'Canva/Figma', 'Copywriting', 'Facebook & Instagram Ads', 'A/B Testing', 'HubSpot'],
      mid:    ['Digital Marketing Strategy', 'Google Analytics 4', 'SEO/SEM', 'Paid Social (Meta/LinkedIn)', 'Email Automation', 'HubSpot', 'Content Strategy', 'A/B Testing', 'Data Analysis', 'Marketing Attribution'],
      senior: ['Marketing Strategy', 'Growth Marketing', 'Performance Marketing', 'Brand Management', 'Google Analytics', 'Salesforce', 'HubSpot', 'Budget Management', 'Team Leadership', 'Go-to-Market Planning'],
      staff:  ['CMO-level Strategy', 'Brand Architecture', 'Growth Strategy', 'P&L Management', 'Demand Generation', 'Martech Stack', 'Board-level Communication', 'Team Leadership', 'OKRs', 'Investor Narrative'],
    },
    bullets: {
      entry:  '• Created and scheduled daily social media content across 4 platforms, growing combined following by 2,800 in 3 months\n• Wrote SEO-optimized blog posts driving 15% increase in organic traffic within first quarter\n• Assisted in executing email campaigns with 28% average open rate, above industry benchmark',
      junior: '• Managed paid social campaigns with $15K monthly budget achieving 3.2x ROAS across Meta and Instagram\n• Developed content calendar and produced 40+ pieces of content monthly, increasing engagement rate by 42%\n• Ran A/B tests on email subject lines improving click-through rate from 2.1% to 4.8%',
      mid:    '• Owned performance marketing strategy with $180K quarterly budget, driving 35% YoY growth in qualified pipeline\n• Launched integrated campaign across 6 channels generating 4,200 leads at 28% below target CPL\n• Implemented marketing attribution model giving leadership clear visibility into channel ROI for the first time',
      senior: '• Led rebrand initiative increasing brand awareness scores by 18 points in target segment within 6 months\n• Built and managed a 9-person marketing team covering demand gen, content, and brand functions\n• Drove company from 0 to 12,000 MQLs/month in 18 months through multi-channel growth strategy',
      staff:  '• Architected go-to-market strategy for Series B company, contributing to $40M ARR milestone within 24 months\n• Built marketing org from 3 to 25 people across 4 functions, establishing culture of data-driven decision making\n• Repositioned brand narrative that resulted in 3x increase in inbound enterprise pipeline',
    },
  },
  healthcare: {
    keywords: ['health', 'medical', 'nurse', 'doctor', 'clinical', 'pharmacy', 'hospital', 'patient', 'care', 'dental', 'therapist', 'physiotherapy'],
    skills: {
      entry:  ['Patient Care', 'Vital Signs Monitoring', 'Electronic Health Records (EHR)', 'Medical Terminology', 'HIPAA Compliance', 'First Aid/CPR', 'Communication', 'Teamwork', 'Time Management', 'Empathy'],
      junior: ['Patient Assessment', 'EHR Systems', 'Medication Administration', 'Clinical Documentation', 'HIPAA Compliance', 'IV Therapy', 'Wound Care', 'Patient Education', 'Interdisciplinary Collaboration', 'BLS/ACLS'],
      mid:    ['Clinical Leadership', 'EHR Systems', 'Care Coordination', 'Quality Improvement', 'HIPAA/HITECH', 'Staff Training', 'Patient Safety', 'Evidence-Based Practice', 'Budgeting', 'Regulatory Compliance'],
      senior: ['Healthcare Management', 'Clinical Operations', 'Quality & Patient Safety', 'Regulatory Compliance (JC)', 'Staff Development', 'Budget Management', 'Strategic Planning', 'Stakeholder Engagement', 'EHR Optimization', 'Performance Metrics'],
      staff:  ['Healthcare Strategy', 'Executive Leadership', 'Clinical Governance', 'Regulatory Affairs', 'P&L Management', 'Change Management', 'Board Reporting', 'Community Partnerships', 'Value-Based Care', 'Physician Relations'],
    },
    bullets: {
      entry:  '• Provided compassionate direct patient care to 8–12 patients per shift in a fast-paced medical-surgical unit\n• Maintained accurate clinical documentation in Epic EHR with 100% compliance on mandatory fields\n• Collaborated with multidisciplinary team to develop individualized care plans improving patient satisfaction scores by 12%',
      junior: '• Delivered high-acuity nursing care for up to 6 ICU patients, maintaining 0 medication errors over 18 months\n• Led patient education sessions reducing 30-day readmission rate for CHF patients by 22%\n• Precepted 3 new graduate nurses, guiding them through orientation and competency validation',
      mid:    '• Coordinated care for a 28-bed unit, overseeing staff scheduling and daily operations for a 15-nurse team\n• Implemented a new discharge planning protocol reducing average length of stay by 0.8 days\n• Led NDNQI quality initiative that improved fall rate from 3.2 to 1.1 per 1,000 patient days',
      senior: '• Directed nursing operations across 3 inpatient units (84 beds) with a $6M annual labor budget\n• Achieved Joint Commission accreditation with zero significant findings through rigorous compliance program\n• Reduced nursing turnover from 28% to 14% by launching structured mentorship and career development pathways',
      staff:  '• Led clinical transformation program across 6 hospital campuses affecting 2,400 clinical staff\n• Drove $12M in operational savings through staffing model redesign and supply chain optimization\n• Established regional Center of Excellence designation through quality outcomes ranked in top 10% nationally',
    },
  },
  education: {
    keywords: ['teach', 'teacher', 'education', 'instructor', 'professor', 'tutor', 'curriculum', 'school', 'training', 'learning', 'academic'],
    skills: {
      entry:  ['Lesson Planning', 'Classroom Management', 'Differentiated Instruction', 'Google Classroom', 'Microsoft Office', 'Student Assessment', 'Parent Communication', 'Curriculum Alignment', 'Patience', 'Adaptability'],
      junior: ['Curriculum Development', 'Classroom Management', 'Differentiated Instruction', 'Google Workspace for Education', 'Formative Assessment', 'Student Engagement', 'IEP Support', 'Data-Driven Instruction', 'Parent Communication', 'Collaborative Planning'],
      mid:    ['Curriculum Design', 'Instructional Coaching', 'Data Analysis', 'Professional Development', 'Google Classroom', 'Project-Based Learning', 'Special Education Coordination', 'Teacher Mentorship', 'Assessment Design', 'Educational Technology'],
      senior: ['Educational Leadership', 'Curriculum & Instruction', 'Staff Evaluation', 'Professional Development', 'School Improvement Planning', 'Budget Management', 'Community Engagement', 'Data-Driven Decision Making', 'Compliance', 'Strategic Planning'],
      staff:  ['Institutional Strategy', 'Academic Affairs', 'Accreditation', 'Budget Oversight', 'Faculty Development', 'Board Relations', 'Community Partnerships', 'Enrollment Management', 'Policy Development', 'Educational Equity'],
    },
    bullets: {
      entry:  '• Planned and delivered engaging daily lessons for 28 students across all core subjects, achieving 91% proficiency on state assessments\n• Implemented differentiated instruction strategies supporting 4 students with IEPs and 3 ELL students\n• Built positive classroom community resulting in 95% student satisfaction on end-of-year survey',
      junior: '• Raised average student reading levels by 1.4 grade levels over one academic year through targeted small-group instruction\n• Designed project-based learning units that increased student engagement scores from 67% to 89%\n• Mentored a student teacher for 10 weeks, providing structured feedback and modeling best practices',
      mid:    '• Coached 12 teachers in data-driven instruction practices, resulting in 18% improvement in schoolwide math proficiency\n• Led curriculum mapping project aligning K–8 math scope and sequence to Common Core standards\n• Designed and facilitated 40+ hours of professional development workshops across the academic year',
      senior: '• Improved school performance rating from "Needs Improvement" to "Meets Standard" within 2 academic years\n• Oversaw $2.4M instructional budget and secured $380K in grants for STEM programming\n• Reduced chronic absenteeism by 31% through community outreach program and family engagement initiative',
      staff:  '• Led district-wide strategic plan affecting 14 schools, 8,000 students, and 620 staff members\n• Achieved regional accreditation with commendation, the highest recognition level, for the first time in district history\n• Closed achievement gap by 22 percentage points over 4 years through equitable resource allocation and targeted intervention programs',
    },
  },
  general: {
    keywords: [],
    skills: {
      entry:  ['Microsoft Office', 'Communication', 'Teamwork', 'Time Management', 'Problem Solving', 'Attention to Detail', 'Customer Service', 'Organization', 'Adaptability', 'Data Entry'],
      junior: ['Project Coordination', 'Microsoft Office Suite', 'Communication', 'Time Management', 'Data Analysis', 'Customer Relations', 'Process Improvement', 'Teamwork', 'Reporting', 'Organization'],
      mid:    ['Project Management', 'Team Coordination', 'Process Improvement', 'Stakeholder Management', 'Data Analysis', 'Microsoft Office', 'Budget Tracking', 'Reporting', 'Communication', 'Strategic Planning'],
      senior: ['Strategic Planning', 'Team Leadership', 'Project Management', 'Stakeholder Management', 'Budget Management', 'Process Optimization', 'Performance Management', 'Communication', 'Decision Making', 'Change Management'],
      staff:  ['Executive Leadership', 'Organizational Strategy', 'P&L Management', 'Board Relations', 'Change Management', 'Team Building', 'Stakeholder Engagement', 'OKRs', 'Operational Excellence', 'Cross-functional Leadership'],
    },
    bullets: {
      entry:  '• Supported daily operations by handling administrative tasks, scheduling, and correspondence with 100% accuracy\n• Assisted team of 8 with project coordination, tracking deadlines and ensuring timely delivery of deliverables\n• Identified and resolved a recurring workflow inefficiency, saving the team approximately 3 hours per week',
      junior: '• Coordinated cross-functional projects involving 4 departments, delivering 95% of milestones on schedule\n• Prepared weekly performance reports for management, improving visibility into key operational metrics\n• Streamlined an administrative process reducing turnaround time from 5 days to 2 days',
      mid:    '• Managed a portfolio of 8 concurrent projects with a combined budget of $2.2M, achieving 92% on-time delivery\n• Led process redesign initiative that reduced operational costs by 18% within the first 6 months\n• Built and maintained strong relationships with 15+ key stakeholders across 3 business units',
      senior: '• Directed departmental operations for a team of 22, consistently achieving quarterly targets at 105%+ of goal\n• Spearheaded organizational restructuring that improved team efficiency by 30% and reduced overhead by $420K annually\n• Established KPI framework and reporting cadence that gave leadership real-time visibility into performance for the first time',
      staff:  '• Led company-wide transformation program impacting 400+ employees and $80M in annual revenue\n• Built high-performing leadership team of 12 direct reports, achieving 90% retention over 3 years\n• Drove expansion into 2 new markets generating $22M in incremental revenue within 18 months of launch',
    },
  },
};

function detectField(jobTitle, fieldInput) {
  const combined = `${jobTitle} ${fieldInput}`.toLowerCase();
  for (const [key, data] of Object.entries(fields)) {
    if (key === 'general') continue;
    if (data.keywords.some(k => combined.includes(k))) return key;
  }
  return 'general';
}

function getLevel(years) {
  if (years <= 1) return 'entry';
  if (years <= 3) return 'junior';
  if (years <= 6) return 'mid';
  if (years <= 10) return 'senior';
  return 'staff';
}

function buildSummary(jobTitle, years, level, fieldKey) {
  const levelLabels = { entry: 'motivated', junior: 'results-driven', mid: 'accomplished', senior: 'seasoned', staff: 'visionary' };
  const expPhrases = {
    entry:  'eager to apply academic knowledge and a strong work ethic to real-world challenges',
    junior: `with ${years} years of hands-on experience delivering impactful results`,
    mid:    `with ${years} years of experience driving meaningful outcomes in fast-paced environments`,
    senior: `with over ${years} years of progressive experience leading high-impact initiatives`,
    staff:  `with ${years}+ years of executive-level experience shaping organizational strategy and culture`,
  };
  const values = {
    entry:  'Known for a quick learning curve, collaborative spirit, and dedication to producing high-quality work.',
    junior: 'Combines technical proficiency with strong communication skills to bridge individual contribution and team success.',
    mid:    'Proven track record of translating complex challenges into structured solutions that deliver measurable business value.',
    senior: 'Recognized for building high-performing teams, fostering a culture of excellence, and aligning execution with strategic objectives.',
    staff:  'Trusted advisor and people leader known for building resilient organizations and driving sustainable growth at scale.',
  };

  return `${levelLabels[level].charAt(0).toUpperCase() + levelLabels[level].slice(1)} ${jobTitle} ${expPhrases[level]}. ${values[level]}`;
}

export function generateResumeContent({ job_title, years_experience, field, existing_skills = [] }) {
  const years = Number(years_experience);
  const fieldKey = detectField(job_title, field);
  const level = getLevel(years);
  const fieldData = fields[fieldKey];

  let skills = [...fieldData.skills[level]];
  if (existing_skills.length > 0) {
    const normalized = existing_skills.map(s => s.toLowerCase());
    const extras = existing_skills.filter(s => !skills.some(sk => sk.toLowerCase() === s.toLowerCase()));
    skills = [...extras, ...skills.filter(s => !normalized.includes(s.toLowerCase()))].slice(0, 12);
  }

  return {
    summary: buildSummary(job_title, years, level, fieldKey),
    skills,
    experience_description: fieldData.bullets[level],
  };
}
