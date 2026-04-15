-- Patient Record System Database
CREATE DATABASE IF NOT EXISTS patient_record_db;
USE patient_record_db;

-- Users table (for login)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('admin', 'doctor', 'nurse') DEFAULT 'doctor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    blood_type VARCHAR(5),
    phone VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    emergency_contact VARCHAR(150),
    emergency_phone VARCHAR(20),
    insurance_number VARCHAR(50),
    allergies TEXT,
    chronic_conditions TEXT,
    status ENUM('Active', 'Discharged', 'Critical', 'Stable', 'Under Observation') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Records table
CREATE TABLE IF NOT EXISTS medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL,
    visit_date DATE NOT NULL,
    doctor_name VARCHAR(150),
    department VARCHAR(100),
    diagnosis TEXT,
    symptoms TEXT,
    treatment TEXT,
    medications TEXT,
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

-- History/audit log
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    performed_by VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin user (password: Admin@123)
INSERT INTO users (username, password, full_name, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. System Administrator', 'admin'),
('dr.morgan', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Elena Morgan', 'doctor'),
('nurse.chen', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nurse James Chen', 'nurse');

-- Seed patients with realistic diverse names
INSERT INTO patients (patient_id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, emergency_phone, insurance_number, allergies, chronic_conditions, status) VALUES
('PRS-00001', 'Amara', 'Okonkwo', '1985-03-12', 'Female', 'O+', '+237 677 123 456', 'amara.okonkwo@gmail.com', '14 Rue des Palmiers, Yaoundé', 'Kwame Okonkwo', '+237 677 654 321', 'INS-2024-001', 'Penicillin', 'Hypertension', 'Stable'),
('PRS-00002', 'Thierry', 'Nkemdirim', '1992-07-28', 'Male', 'A+', '+237 699 234 567', 'thierry.nkemdirim@yahoo.com', '7 Av. Kennedy, Douala', 'Marie Nkemdirim', '+237 699 876 543', 'INS-2024-002', 'None', 'Diabetes Type 2', 'Active'),
('PRS-00003', 'Fatima', 'Al-Rashid', '1978-11-05', 'Female', 'B-', '+237 677 345 678', 'fatima.alrashid@outlook.com', '22 Quartier Bastos, Yaoundé', 'Omar Al-Rashid', '+237 677 543 210', 'INS-2024-003', 'Sulfa drugs', 'Asthma', 'Under Observation'),
('PRS-00004', 'Marcus', 'Ebangha', '1965-01-19', 'Male', 'AB+', '+237 699 456 789', 'marcus.ebangha@gmail.com', '3 Rue Foch, Bafoussam', 'Grace Ebangha', '+237 699 321 098', 'INS-2024-004', 'Aspirin, Latex', 'Heart Disease, Hypertension', 'Critical'),
('PRS-00005', 'Solange', 'Mbarga', '2001-06-14', 'Female', 'O-', '+237 677 567 890', 'solange.mbarga@gmail.com', '18 Av. de l\'Indépendance, Ngaoundéré', 'Paul Mbarga', '+237 677 210 987', 'INS-2024-005', 'None', 'None', 'Active'),
('PRS-00006', 'Emmanuel', 'Fotso', '1958-09-30', 'Male', 'A-', '+237 699 678 901', 'e.fotso@business.cm', '45 Rue de la Réunification, Douala', 'Cécile Fotso', '+237 699 109 876', 'INS-2024-006', 'Ibuprofen', 'Arthritis, High Cholesterol', 'Stable'),
('PRS-00007', 'Ngozi', 'Adeyemi', '1990-04-22', 'Female', 'B+', '+237 677 789 012', 'ngozi.adeyemi@gmail.com', '9 Quartier Melen, Yaoundé', 'Chidi Adeyemi', '+237 677 098 765', 'INS-2024-007', 'Codeine', 'Epilepsy', 'Active'),
('PRS-00008', 'Pierre', 'Kamga', '1975-12-08', 'Male', 'O+', '+237 699 890 123', 'pierre.kamga@hotmail.com', '33 Rue des Flamboyants, Buéa', 'Hélène Kamga', '+237 699 987 654', 'INS-2024-008', 'Shellfish (food)', 'None', 'Active'),
('PRS-00009', 'Aisha', 'Bello', '1988-08-17', 'Female', 'AB-', '+237 677 901 234', 'aisha.bello@gmail.com', '6 Av. Ahmadou Ahidjo, Garoua', 'Ibrahim Bello', '+237 677 876 543', 'INS-2024-009', 'Pollen (seasonal)', 'Anemia', 'Stable'),
('PRS-00010', 'Christophe', 'Zang', '1995-02-25', 'Male', 'A+', '+237 699 012 345', 'chris.zang@gmail.com', '28 Rue Nachtigal, Yaoundé', 'Brigitte Zang', '+237 699 654 321', 'INS-2024-010', 'None', 'None', 'Active'),
('PRS-00011', 'Mariama', 'Diallo', '1970-05-11', 'Female', 'B+', '+237 677 112 233', 'mariama.diallo@gmail.com', '15 Quartier Mokolo, Maroua', 'Boubacar Diallo', '+237 677 332 211', 'INS-2024-011', 'Morphine', 'Lupus, Hypertension', 'Under Observation'),
('PRS-00012', 'Gilles', 'Atangana', '1983-10-03', 'Male', 'O-', '+237 699 223 344', 'gilles.atangana@yahoo.fr', '52 Av. Winston Churchill, Douala', 'Sophie Atangana', '+237 699 443 322', 'INS-2024-012', 'Tetracycline', 'COPD', 'Active'),
('PRS-00013', 'Yewande', 'Osei', '1999-07-16', 'Female', 'A-', '+237 677 334 455', 'yewande.osei@gmail.com', '11 Rue de la Gare, Kumba', 'Kofi Osei', '+237 677 554 433', 'INS-2024-013', 'None', 'None', 'Active'),
('PRS-00014', 'Robert', 'Tchoupo', '1961-03-27', 'Male', 'AB+', '+237 699 445 566', 'r.tchoupo@enterprise.cm', '7 Av. de Gaulle, Yaoundé', 'Jeanne Tchoupo', '+237 699 665 544', 'INS-2024-014', 'Aspirin, Nuts', 'Parkinson\'s Disease', 'Stable'),
('PRS-00015', 'Nadège', 'Tabi', '1993-11-20', 'Female', 'O+', '+237 677 556 677', 'nadege.tabi@gmail.com', '24 Rue des Manguiers, Limbe', 'François Tabi', '+237 677 776 655', 'INS-2024-015', 'Penicillin, Dust mites', 'Thyroid Disorder', 'Active');

-- Medical records
INSERT INTO medical_records (patient_id, visit_date, doctor_name, department, diagnosis, symptoms, treatment, medications, notes, follow_up_date) VALUES
('PRS-00001', '2026-03-15', 'Dr. Elena Morgan', 'Cardiology', 'Hypertensive crisis', 'Severe headache, blurred vision, chest tightness', 'IV antihypertensive, monitoring', 'Amlodipine 10mg, Hydrochlorothiazide 25mg', 'BP was 180/110 on admission. Stabilized after 6 hours.', '2026-04-15'),
('PRS-00002', '2026-03-20', 'Dr. Samuel Eto', 'Endocrinology', 'Uncontrolled Type 2 Diabetes', 'Polydipsia, polyuria, fatigue', 'Diet counseling, medication adjustment', 'Metformin 1000mg, Sitagliptin 100mg', 'HbA1c: 9.2%. Needs dietary compliance improvement.', '2026-05-01'),
('PRS-00003', '2026-04-01', 'Dr. Elena Morgan', 'Pulmonology', 'Acute Asthma Exacerbation', 'Wheezing, shortness of breath, coughing', 'Nebulization, corticosteroids', 'Salbutamol inhaler, Prednisolone 30mg', 'Peak flow 60% of predicted. Responding well.', '2026-04-22'),
('PRS-00004', '2026-04-10', 'Dr. James Akono', 'ICU', 'Acute Myocardial Infarction', 'Severe chest pain, sweating, nausea', 'Emergency PCI, anticoagulation therapy', 'Aspirin 300mg (alt), Clopidogrel, Heparin IV', 'STEMI confirmed. Transferred to ICU. Family notified.', '2026-04-17'),
('PRS-00005', '2026-04-12', 'Dr. Elena Morgan', 'General Medicine', 'Upper Respiratory Tract Infection', 'Sore throat, mild fever, runny nose', 'Symptomatic treatment, rest', 'Paracetamol 500mg, Vitamin C supplements', 'Viral URI. No antibiotics needed.', '2026-04-26'),
('PRS-00001', '2026-01-10', 'Dr. James Akono', 'Cardiology', 'Routine Cardiology Follow-up', 'None (routine visit)', 'BP monitoring, medication review', 'Amlodipine 5mg (adjusted)', 'BP well-controlled at 130/85. Continue current regimen.', '2026-03-10'),
('PRS-00007', '2026-04-08', 'Dr. Ngamba Paul', 'Neurology', 'Breakthrough Seizure', 'Tonic-clonic seizure for 3 minutes', 'IV Diazepam, observation', 'Levetiracetam 1000mg, Diazepam 10mg (acute)', 'Seizure triggered by missed doses. Counseled on adherence.', '2026-05-08'),
('PRS-00011', '2026-04-05', 'Dr. Elena Morgan', 'Rheumatology', 'Lupus Flare', 'Joint pain, butterfly rash, fatigue', 'Immunosuppressive therapy increased', 'Hydroxychloroquine 400mg, Methylprednisolone 16mg', 'ANA positive. ESR elevated. Monitor kidney function.', '2026-04-30');

-- Activity log seed
INSERT INTO activity_log (action, entity_type, entity_id, performed_by, details) VALUES
('LOGIN', 'user', 'admin', 'admin', 'System administrator logged in'),
('CREATE', 'patient', 'PRS-00001', 'admin', 'New patient Amara Okonkwo registered'),
('UPDATE', 'patient', 'PRS-00004', 'dr.morgan', 'Status updated to Critical'),
('CREATE', 'record', 'PRS-00004', 'dr.morgan', 'New medical record added for Marcus Ebangha'),
('VIEW', 'patient', 'PRS-00001', 'dr.morgan', 'Patient profile viewed'),
('CREATE', 'record', 'PRS-00007', 'dr.morgan', 'Emergency record created for Ngozi Adeyemi');
