/* Comprehensive seed: all users, courses, lessons, assignments, enrollments, progress, Q&A, notifications.
 * Idempotent — skips data that already exists.
 * Usage: node scripts/seed-all.js
 */
const { connectDB, disconnectDB } = require('../src/config/db');
const config = require('../src/config/env');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const Enrollment = require('../src/models/Enrollment');
const LessonProgress = require('../src/models/LessonProgress');
const Assignment = require('../src/models/Assignment');
const AssignmentSubmission = require('../src/models/AssignmentSubmission');
const Question = require('../src/models/Question');
const Answer = require('../src/models/Answer');
const Notification = require('../src/models/Notification');

// ── Helpers ────────────────────────────────────────────────────────

const upsert = async (Model, filter, data, label) => {
  const existing = await Model.findOne(filter);
  if (existing) {
    console.log(`  - exists: ${label}`);
    return existing;
  }
  const doc = await Model.create(data);
  console.log(`  + created: ${label}`);
  return doc;
};

const syncTotalLessons = async (courseId) => {
  const totalLessons = await Lesson.countDocuments({ courseId });
  await Course.updateOne({ _id: courseId }, { totalLessons });
};

// ── Users ──────────────────────────────────────────────────────────

const USERS = [
  { name: 'Administrator', email: 'admin@lms.test', password: 'admin12345', role: 'admin', phone: '081234567890' },
  { name: 'Budi Santoso', email: 'mentor@lms.test', password: 'mentor12345', role: 'mentor', phone: '081234567891', bio: 'Full-stack developer dengan 5 tahun pengalaman' },
  { name: 'Rina Wulandari', email: 'mentor2@lms.test', password: 'mentor12345', role: 'mentor', phone: '081234567892', bio: 'UI/UX Designer & Frontend Developer' },
  { name: 'Ahmad Fauzi', email: 'student@lms.test', password: 'student12345', role: 'student', phone: '081234567893' },
  { name: 'Siti Nurhaliza', email: 'student2@lms.test', password: 'student12345', role: 'student', phone: '081234567894' },
  { name: 'Dewi Kartika', email: 'student3@lms.test', password: 'student12345', role: 'student', phone: '081234567895' },
  { name: 'Rizky Pratama', email: 'student4@lms.test', password: 'student12345', role: 'student', phone: '081234567896' },
  { name: 'Maya Putri', email: 'student5@lms.test', password: 'student12345', role: 'student', phone: '081234567897' },
];

// ── Courses ────────────────────────────────────────────────────────

const COURSES = [
  {
    title: 'Belajar JavaScript Dasar',
    slug: 'belajar-javascript-dasar',
    shortDescription: 'Pelajari fundamental JavaScript dari nol sampai bisa bikin website interaktif.',
    description: '<p>Kursus ini cocok untuk pemula yang mau belajar JavaScript. Kamu akan memahami variabel, tipe data, fungsi, array, object, DOM manipulation, dan async/await.</p><p>Setelah selesai, kamu bisa bikin website interaktif sendiri.</p>',
    category: 'Programming',
    level: 'beginner',
    language: 'id',
    status: 'published',
    price: 0,
    isFeatured: true,
    requirements: ['Komputer/laptop', 'Browser modern (Chrome/Firefox)'],
    learningObjectives: ['Memahami variabel dan tipe data', 'Menguasai fungsi dan scope', 'Manipulasi DOM dengan JavaScript', 'Menggunakan async/await'],
    publishedAt: new Date(),
  },
  {
    title: 'React Fundamentals',
    slug: 'react-fundamentals',
    shortDescription: 'Membangun UI interaktif dengan React.js dari dasar.',
    description: '<p>Kursus mencakup JSX, components, props, state, hooks, dan routing. Cocok untuk yang sudah paham JavaScript dasar.</p>',
    category: 'Frontend',
    level: 'intermediate',
    language: 'id',
    status: 'published',
    price: 0,
    isFeatured: true,
    requirements: ['Kemampuan JavaScript dasar', 'Node.js terinstall'],
    learningObjectives: ['Membuat React components', 'Menggunakan hooks (useState, useEffect)', 'React Router untuk navigasi', 'State management dengan Context'],
    publishedAt: new Date(),
  },
  {
    title: 'Node.js & Express API',
    slug: 'nodejs-express-api',
    shortDescription: 'Membangun RESTful API yang production-ready dengan Node.js dan Express.',
    description: '<p>Pelajari routing, middleware, authentication, validation, dan MongoDB integration. Cocok untuk backend developer.</p>',
    category: 'Backend',
    level: 'intermediate',
    language: 'id',
    status: 'published',
    price: 0,
    isFeatured: false,
    requirements: ['JavaScript dasar', 'Node.js 18+'],
    learningObjectives: ['Membuat Express server', 'Implementasi JWT auth', 'Validasi input dengan Zod', 'CRUD dengan MongoDB/Mongoose'],
    publishedAt: new Date(),
  },
  {
    title: 'Database Design & MongoDB',
    slug: 'database-design-mongodb',
    shortDescription: 'Prinsip desain database dan penggunaan MongoDB untuk aplikasi modern.',
    description: '<p>Mencakup schema design, indexing, aggregation, dan best practices MongoDB.</p>',
    category: 'Database',
    level: 'beginner',
    language: 'id',
    status: 'published',
    price: 0,
    isFeatured: false,
    requirements: [],
    learningObjectives: ['Memahami NoSQL vs SQL', 'Design schema yang efisien', 'Indexing untuk performa', 'Aggregation pipeline'],
    publishedAt: new Date(),
  },
  {
    title: 'TypeScript untuk Pengembang',
    slug: 'typescript-untuk-pengembang',
    shortDescription: 'Kuasai TypeScript untuk kode yang lebih aman dan terstruktur.',
    description: '<p>Type annotations, generics, utility types, dan integrasi dengan React & Node.js.</p>',
    category: 'Programming',
    level: 'intermediate',
    language: 'id',
    status: 'published',
    price: 0,
    isFeatured: false,
    requirements: ['JavaScript intermediate'],
    learningObjectives: ['Type annotations & interfaces', 'Generics dan utility types', 'TypeScript dengan React', 'TypeScript dengan Node.js'],
    publishedAt: new Date(),
  },
  {
    title: 'UI/UX Design Principles',
    slug: 'ui-ux-design-principles',
    shortDescription: 'Prinsip desain antarmuka yang baik untuk pengembang.',
    description: '<p>Color theory, typography, layout, responsive design, dan accessibility.</p>',
    category: 'Design',
    level: 'beginner',
    language: 'id',
    status: 'published',
    price: 0,
    isFeatured: true,
    requirements: [],
    learningObjectives: ['Color theory dan palette', 'Typography yang baik', 'Responsive layout', 'Accessibility basics'],
    publishedAt: new Date(),
  },
  {
    title: 'Python untuk Data Science',
    slug: 'python-untuk-data-science',
    shortDescription: 'Belajar Python dari dasar untuk analisis data.',
    description: '<p>Cocok untuk pemula. Kamu akan belajar Python fundamentals, manipulasi data dengan pandas, dan visualisasi.</p>',
    category: 'Data Science',
    level: 'beginner',
    language: 'id',
    status: 'published',
    price: 0,
    isFeatured: false,
    requirements: [],
    learningObjectives: ['Python basics', 'Data manipulation dengan pandas', 'Visualisasi data', 'Statistik dasar'],
    publishedAt: new Date(),
  },
  {
    title: 'Docker & Containerization',
    slug: 'docker-containerization',
    shortDescription: 'Deploy aplikasi dengan Docker dan Docker Compose.',
    description: '<p>Pelajari containerization, Dockerfile, Docker Compose, dan deployment workflow.</p>',
    category: 'DevOps',
    level: 'intermediate',
    language: 'id',
    status: 'published',
    price: 0,
    isFeatured: false,
    requirements: ['Linux basics', 'Command line familiarity'],
    learningObjectives: ['Docker basics', 'Dockerfile best practices', 'Docker Compose', 'Container networking'],
    publishedAt: new Date(),
  },
  {
    title: 'Git & Version Control',
    slug: 'git-version-control',
    shortDescription: 'Kuasai Git untuk version control yang efektif.',
    description: '<p>Basic commands, branching, merging, pull requests, dan Git workflow.</p>',
    category: 'Tools',
    level: 'beginner',
    language: 'id',
    status: 'draft',
    price: 0,
    isFeatured: false,
    requirements: [],
    learningObjectives: ['Git basics', 'Branching strategy', 'Merge vs rebase', 'GitHub workflow'],
    publishedAt: null,
  },
  {
    title: 'RESTful API Design',
    slug: 'restful-api-design',
    shortDescription: 'Prinsip desain REST API yang baik dan konsisten.',
    description: '<p>HTTP methods, status codes, URL structure, versioning, dan best practices.</p>',
    category: 'Backend',
    level: 'advanced',
    language: 'id',
    status: 'published',
    price: 0,
    isFeatured: false,
    requirements: ['Backend development experience'],
    learningObjectives: ['REST principles', 'API versioning', 'Error handling patterns', 'API documentation'],
    publishedAt: new Date(),
  },
];

// ── Lessons per Course ─────────────────────────────────────────────

const LESSONS_DATA = {
  'belajar-javascript-dasar': [
    { title: 'Pengenalan JavaScript', contentType: 'text', duration: 10, textContent: '<p>JavaScript adalah bahasa pemrograman yang digunakan untuk membuat website interaktif. Semua browser modern mendukung JavaScript.</p>' },
    { title: 'Variabel dan Tipe Data', contentType: 'text', duration: 15, textContent: '<p>var, let, const untuk deklarasi variabel. Tipe data: Number, String, Boolean, null, undefined, Object.</p>' },
    { title: 'Operator di JavaScript', contentType: 'text', duration: 12, textContent: '<p>Arithmetic (+, -, *, /), comparison (==, ===, !=, !==), logical (&&, ||, !), dan assignment operators.</p>' },
    { title: 'Fungsi dan Scope', contentType: 'text', duration: 18, textContent: '<p>Function declaration, expression, arrow function, dan scope chain (global, function, block scope).</p>' },
    { title: 'Array dan Object', contentType: 'text', duration: 20, textContent: '<p>Manipulasi array: map, filter, reduce, find. Object destructuring dan spread operator.</p>' },
    { title: 'DOM Manipulation', contentType: 'video', duration: 25, youtubeUrl: 'https://www.youtube.com/watch?v=0ik6X4DJKCc' },
    { title: 'Event Handling', contentType: 'video', duration: 20, youtubeUrl: 'https://www.youtube.com/watch?v=XF1_MlS6vBw' },
    { title: 'Async JavaScript', contentType: 'text', duration: 22, textContent: '<p>Callbacks, Promises, async/await, dan error handling dengan try/catch.</p>' },
  ],
  'react-fundamentals': [
    { title: 'Apa itu React?', contentType: 'text', duration: 8, textContent: '<p>React adalah library UI dari Facebook untuk membangun antarmuka interaktif. Menggunakan virtual DOM untuk performa.</p>' },
    { title: 'JSX dan Component', contentType: 'text', duration: 12, textContent: '<p>JSX adalah syntax extension yang mirip HTML. Component adalah blok bangunan UI yang bisa dipakai ulang.</p>' },
    { title: 'Props dan State', contentType: 'text', duration: 15, textContent: '<p>Props untuk passing data dari parent ke child. State untuk data internal yang bisa berubah.</p>' },
    { title: 'Hooks: useState & useEffect', contentType: 'video', duration: 20, youtubeUrl: 'https://www.youtube.com/watch?v=dpw9EHDh2bM' },
    { title: 'React Router', contentType: 'text', duration: 14, textContent: '<p>Navigasi antar halaman dengan React Router v6. Route, Link, dan useParams.</p>' },
    { title: 'Context API', contentType: 'text', duration: 16, textContent: '<p>Shared state tanpa prop drilling menggunakan createContext dan useContext.</p>' },
  ],
  'nodejs-express-api': [
    { title: 'Mengenal Node.js', contentType: 'text', duration: 10, textContent: '<p>Node.js adalah runtime JavaScript di server. Event-driven, non-blocking I/O.</p>' },
    { title: 'Express.js Dasar', contentType: 'text', duration: 15, textContent: '<p>Routing, middleware, dan request/response cycle. app.get(), app.post(), app.use().</p>' },
    { title: 'RESTful API Design', contentType: 'text', duration: 18, textContent: '<p>GET, POST, PUT, PATCH, DELETE. Status codes: 200, 201, 400, 404, 500.</p>' },
    { title: 'Authentication dengan JWT', contentType: 'video', duration: 22, youtubeUrl: 'https://www.youtube.com/watch?v=mbskti-1PiI' },
    { title: 'Input Validation', contentType: 'text', duration: 14, textContent: '<p>Validasi input dengan Zod untuk keamanan data. Schema validation dan error handling.</p>' },
    { title: 'MongoDB dengan Mongoose', contentType: 'video', duration: 25, youtubeUrl: 'https://www.youtube.com/watch?v=5dqrKOwJqgI' },
    { title: 'Error Handling', contentType: 'text', duration: 12, textContent: '<p>Global error handler, custom ApiError, dan async wrapper untuk handle errors.</p>' },
  ],
  'database-design-mongodb': [
    { title: 'Pengenalan Database', contentType: 'text', duration: 10, textContent: '<p>SQL vs NoSQL, relational vs document-based. Kapan pakai MongoDB vs PostgreSQL.</p>' },
    { title: 'Schema Design', contentType: 'text', duration: 18, textContent: '<p>Embedded vs referenced documents. Data modeling patterns untuk aplikasi real.</p>' },
    { title: 'Indexing', contentType: 'text', duration: 15, textContent: '<p>Single field, compound, dan text indexes. Index untuk performa query.</p>' },
    { title: 'Aggregation Pipeline', contentType: 'video', duration: 20, youtubeUrl: 'https://www.youtube.com/watch?v=VwDKo_0fhY4' },
    { title: 'MongoDB Best Practices', contentType: 'text', duration: 12, textContent: '<p>Validation rules, transactions, dan backup strategies.</p>' },
  ],
  'typescript-untuk-pengembang': [
    { title: 'Pengenalan TypeScript', contentType: 'text', duration: 10, textContent: '<p>TypeScript = JavaScript + static typing. Compile ke JavaScript yang bisa dijalankan browser/Node.</p>' },
    { title: 'Type Annotations', contentType: 'text', duration: 15, textContent: '<p>Primitive types, arrays, objects, union (string | number), intersection types.</p>' },
    { title: 'Interfaces dan Types', contentType: 'text', duration: 14, textContent: '<p>Defining shapes, extending interfaces, optional properties, dan readonly.</p>' },
    { title: 'Generics', contentType: 'video', duration: 18, youtubeUrl: 'https://www.youtube.com/watch?v=nVi7PtT1a0Q' },
    { title: 'Utility Types', contentType: 'text', duration: 12, textContent: '<p>Partial, Pick, Omit, Record, ReturnType untuk transformasi types.</p>' },
  ],
  'ui-ux-design-principles': [
    { title: 'Pengenalan UI/UX', contentType: 'text', duration: 10, textContent: '<p>Perbedaan UI dan UX. UI = tampilan, UX = pengalaman pengguna.</p>' },
    { title: 'Color Theory', contentType: 'text', duration: 15, textContent: '<p>Color wheel, complementary colors, color harmony. Tools: Coolors, Adobe Color.</p>' },
    { title: 'Typography', contentType: 'text', duration: 12, textContent: '<p>Font selection, hierarchy, line height, readability. Sans-serif vs serif.</p>' },
    { title: 'Layout & Grid System', contentType: 'text', duration: 18, textContent: '<p>Grid system, whitespace, visual hierarchy. Responsive breakpoints.</p>' },
    { title: 'Accessibility Basics', contentType: 'text', duration: 14, textContent: '<p>WCAG guidelines, color contrast, keyboard navigation, screen reader support.</p>' },
  ],
  'python-untuk-data-science': [
    { title: 'Python Basics', contentType: 'text', duration: 15, textContent: '<p>Variables, data types, loops,条件 statements, functions.</p>' },
    { title: 'Data Structures', contentType: 'text', duration: 18, textContent: '<p>Lists, dictionaries, tuples, sets. List comprehensions.</p>' },
    { title: 'NumPy Fundamentals', contentType: 'text', duration: 20, textContent: '<p>Arrays, operations, broadcasting. Vectorized computations.</p>' },
    { title: 'Pandas untuk Data Manipulation', contentType: 'video', duration: 25, youtubeUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg' },
    { title: 'Data Visualization', contentType: 'text', duration: 16, textContent: '<p>Matplotlib basics. Line charts, bar charts, scatter plots.</p>' },
  ],
  'docker-containerization': [
    { title: 'What is Docker?', contentType: 'text', duration: 10, textContent: '<p>Containers vs VMs. Why Docker? Benefits for development and deployment.</p>' },
    { title: 'Docker Basics', contentType: 'text', duration: 15, textContent: '<p>Docker images, containers, Dockerfile, docker run, docker ps.</p>' },
    { title: 'Dockerfile Best Practices', contentType: 'text', duration: 18, textContent: '<p>Multi-stage builds, layer caching, .dockerignore, security.</p>' },
    { title: 'Docker Compose', contentType: 'video', duration: 22, youtubeUrl: 'https://www.youtube.com/watch?v=3c-iBn73dDE' },
    { title: 'Container Networking', contentType: 'text', duration: 14, textContent: '<p>Bridge networks, links, port mapping, service discovery.</p>' },
  ],
  'restful-api-design': [
    { title: 'REST Principles', contentType: 'text', duration: 12, textContent: '<p>Stateless, client-server, uniform interface, layered system.</p>' },
    { title: 'HTTP Methods & Status Codes', contentType: 'text', duration: 15, textContent: '<p>GET, POST, PUT, PATCH, DELETE. 2xx, 3xx, 4xx, 5xx responses.</p>' },
    { title: 'URL Design', contentType: 'text', duration: 14, textContent: '<p>Nouns vs verbs, plural resources, nested resources, query parameters.</p>' },
    { title: 'Versioning Strategies', contentType: 'text', duration: 16, textContent: '<p>URL versioning, header versioning, query parameter versioning.</p>' },
    { title: 'Error Handling Patterns', contentType: 'text', duration: 12, textContent: '<p>Consistent error format, error codes, validation errors.</p>' },
  ],
};

// ── Assignments ────────────────────────────────────────────────────

const ASSIGNMENTS_DATA = [
  {
    courseSlug: 'belajar-javascript-dasar',
    lessonIndex: 4, // Array dan Object lesson
    title: 'Tugas: Manipulasi Array',
    instructions: '<p>Buatlah program JavaScript yang menggunakan map, filter, dan reduce untuk memanipulasi array data siswa.</p><p>Kriteria:</p><ul><li>Gunakan minimal 3 method array</li><li>Kode bersih dan terstruktur</li><li>Ada komentar penjelasan</li></ul>',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    assessmentCriteria: [
      { name: 'Ketepatan Kode', description: 'Kode berjalan tanpa error' },
      { name: 'Penggunaan Method', description: 'Menggunakan map, filter, reduce dengan benar' },
      { name: 'Kebersihan Kode', description: 'Kode rapi, ada komentar' },
    ],
  },
  {
    courseSlug: 'react-fundamentals',
    lessonIndex: 2, // Props dan State
    title: 'Tugas: React Component',
    instructions: '<p>Buatlah React component yang menerima props dan menggunakan state untuk toggle visibility.</p><p>Deliverables:</p><ul><li>Source code (.jsx)</li><li>Screenshot hasil running</li></ul>',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    assessmentCriteria: [
      { name: 'Functionality', description: 'Component berjalan sesuai requirements' },
      { name: 'Code Quality', description: 'Mengikuti React best practices' },
    ],
  },
  {
    courseSlug: 'nodejs-express-api',
    lessonIndex: 2, // RESTful API Design
    title: 'Tugas: Buat REST API',
    instructions: '<p>Buat REST API sederhana untuk CRUD data buku dengan Express.js dan MongoDB.</p><p>Endpoint yang dibutuhkan:</p><ul><li>GET /api/books</li><li>POST /api/books</li><li>PUT /api/books/:id</li><li>DELETE /api/books/:id</li></ul>',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    assessmentCriteria: [
      { name: 'API Design', description: 'RESTful conventions terpenuhi' },
      { name: 'Error Handling', description: 'Ada error handling yang proper' },
      { name: 'Documentation', description: 'Ada README yang jelas' },
    ],
  },
];

// ── Community Q&A ──────────────────────────────────────────────────

const COMMUNITY_DATA = [
  {
    courseSlug: 'belajar-javascript-dasar',
    questions: [
      {
        title: 'Apa bedanya let dan const?',
        body: 'Saya masih bingung kapan harus pakai let vs const. Bisa dijelaskan lebih detail?',
        answer: 'const untuk variabel yang tidak di-reassign, let untuk yang berubah nilainya. Keduanya block-scoped, berbeda dengan var yang function-scoped.',
      },
      {
        title: 'Kenapa async/await lebih baik dari callback?',
        body: 'Apa keuntungan async/await dibanding callback? Kok banyak yang bilang lebih bagus?',
        answer: 'Kode lebih readable, error handling lebih mudah dengan try/catch, dan menghindari callback hell yang menyulitkan debugging.',
      },
    ],
  },
  {
    courseSlug: 'react-fundamentals',
    questions: [
      {
        title: 'React hooks boleh dipanggil conditional?',
        body: 'Apakah boleh pakai hooks di dalam if/else? Saya coba tapi error.',
        answer: 'Tidak boleh. Hooks harus dipanggil di top level component, tidak boleh conditional. Gunakan early return sebelum hooks jika perlu.',
      },
      {
        title: 'Kapan harus pakai useEffect vs useMemo?',
        body: 'Saya sering bingung kapan pakai useEffect dan kapan pakai useMemo. Bedanya apa?',
        answer: 'useEffect untuk side effects (fetching, subscriptions, DOM manipulation). useMemo untuk caching expensive calculations. Jangan pakai useMemo untuk semua computation.',
      },
    ],
  },
  {
    courseSlug: 'nodejs-express-api',
    questions: [
      {
        title: 'Bagaimana cara protect route di Express?',
        body: 'Saya ingin membuat route yang hanya bisa diakses user login. Bagaimana caranya?',
        answer: 'Gunakan middleware authenticate yang verify JWT token, lalu apply di route yang ingin dilindungi. Contoh: router.get("/protected", authenticate, handler).',
      },
    ],
  },
];

// ── Main Seed ──────────────────────────────────────────────────────

(async () => {
  await connectDB(config.mongoUri);
  console.log('=== Comprehensive Seed ===\n');

  // 1. Users
  console.log('── Users ──');
  const users = {};
  for (const u of USERS) {
    const user = await upsert(User, { email: u.email }, u, `${u.name} (${u.role})`);
    users[u.email] = user;
  }

  const admin = users['admin@lms.test'];
  const mentor = users['mentor@lms.test'];
  const mentor2 = users['mentor2@lms.test'];
  const student = users['student@lms.test'];
  const student2 = users['student2@lms.test'];
  const student3 = users['student3@lms.test'];
  const student4 = users['student4@lms.test'];
  const student5 = users['student5@lms.test'];

  // 2. Courses
  console.log('\n── Courses ──');
  const courses = {};
  for (const c of COURSES) {
    const assignedMentor = c.category === 'Design' ? mentor2 : mentor;
    const course = await upsert(Course, { slug: c.slug }, { ...c, mentorId: assignedMentor._id }, c.title);
    courses[c.slug] = course;
  }

  // 3. Lessons
  console.log('\n── Lessons ──');
  for (const [slug, lessons] of Object.entries(LESSONS_DATA)) {
    const course = courses[slug];
    if (!course) continue;
    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      let youtubeVideoId = null;
      if (l.youtubeUrl) {
        const match = l.youtubeUrl.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
        if (match) youtubeVideoId = match[1];
      }
      await upsert(Lesson, { courseId: course._id, order: i + 1 }, {
        courseId: course._id,
        title: l.title,
        contentType: l.contentType,
        textContent: l.textContent || null,
        youtubeUrl: l.youtubeUrl || null,
        youtubeVideoId,
        duration: l.duration,
        order: i + 1,
        isPublished: true,
      }, `${course.title} > Lesson ${i + 1}: ${l.title}`);
    }
    await syncTotalLessons(course._id);
  }

  // 4. Enrollments (all students in all published courses)
  console.log('\n── Enrollments ──');
  const allStudents = [student, student2, student3, student4, student5];
  for (const course of Object.values(courses)) {
    if (course.status !== 'published') continue;
    for (const s of allStudents) {
      await upsert(Enrollment, { studentId: s._id, courseId: course._id }, {
        studentId: s._id,
        courseId: course._id,
        source: 'admin',
        status: 'active',
      }, `${s.name} -> ${course.title}`);
    }
  }

  // 5. Lesson Progress (simulate some progress)
  console.log('\n── Lesson Progress ──');
  const jsLessons = await Lesson.find({ courseId: courses['belajar-javascript-dasar']._id }).sort('order');
  // Student completes first 4 lessons of JS course
  for (let i = 0; i < Math.min(4, jsLessons.length); i++) {
    await upsert(LessonProgress, { studentId: student._id, lessonId: jsLessons[i]._id }, {
      studentId: student._id,
      courseId: courses['belajar-javascript-dasar']._id,
      lessonId: jsLessons[i]._id,
      status: 'completed',
      completedAt: new Date(Date.now() - (4 - i) * 24 * 60 * 60 * 1000),
    }, `${student.name} completed: ${jsLessons[i].title}`);
  }
  // Student2 completes first 2 lessons
  for (let i = 0; i < Math.min(2, jsLessons.length); i++) {
    await upsert(LessonProgress, { studentId: student2._id, lessonId: jsLessons[i]._id }, {
      studentId: student2._id,
      courseId: courses['belajar-javascript-dasar']._id,
      lessonId: jsLessons[i]._id,
      status: 'completed',
      completedAt: new Date(Date.now() - (2 - i) * 24 * 60 * 60 * 1000),
    }, `${student2.name} completed: ${jsLessons[i].title}`);
  }

  // 6. Assignments
  console.log('\n── Assignments ──');
  const assignments = {};
  for (const a of ASSIGNMENTS_DATA) {
    const course = courses[a.courseSlug];
    if (!course) continue;
    const lessons = await Lesson.find({ courseId: course._id }).sort('order');
    const targetLesson = lessons[a.lessonIndex];
    if (!targetLesson) continue;

    const assignment = await upsert(Assignment, { courseId: course._id, title: a.title }, {
      lessonId: targetLesson._id,
      courseId: course._id,
      title: a.title,
      instructions: a.instructions,
      deadline: a.deadline,
      assessmentCriteria: a.assessmentCriteria,
      status: 'published',
      createdBy: mentor._id,
    }, a.title);
    assignments[a.courseSlug] = assignment;
  }

  // 7. Assignment Submissions (student submits to JS assignment)
  console.log('\n── Assignment Submissions ──');
  if (assignments['belajar-javascript-dasar']) {
    await upsert(AssignmentSubmission, {
      assignmentId: assignments['belajar-javascript-dasar']._id,
      studentId: student._id,
    }, {
      assignmentId: assignments['belajar-javascript-dasar']._id,
      studentId: student._id,
      courseId: courses['belajar-javascript-dasar']._id,
      note: 'Berikut tugas array manipulation saya.',
      status: 'submitted',
    }, `${student.name} submitted: ${assignments['belajar-javascript-dasar'].title}`);
  }

  // 8. Community Q&A
  console.log('\n── Community Q&A ──');
  for (const c of COMMUNITY_DATA) {
    const course = courses[c.courseSlug];
    if (!course) continue;
    for (const q of c.questions) {
      const question = await upsert(Question, { courseId: course._id, title: q.title }, {
        courseId: course._id,
        authorId: student._id,
        title: q.title,
        body: q.body,
      }, `Q: ${q.title}`);
      await upsert(Answer, { questionId: question._id, authorId: mentor._id }, {
        questionId: question._id,
        authorId: mentor._id,
        body: q.answer,
        isVerified: true,
      }, `A on: ${q.title}`);
    }
  }

  // 9. Notifications
  console.log('\n── Notifications ──');
  if (assignments['belajar-javascript-dasar']) {
    await upsert(Notification, {
      recipientId: student._id,
      type: 'ASSIGNMENT_PUBLISHED',
      assignmentId: assignments['belajar-javascript-dasar']._id,
    }, {
      recipientId: student._id,
      actorId: mentor._id,
      type: 'ASSIGNMENT_PUBLISHED',
      title: 'Tugas baru: Manipulasi Array',
      message: 'Tugas baru telah dipublikasikan untuk kursus JavaScript Dasar.',
      courseId: courses['belajar-javascript-dasar']._id,
      assignmentId: assignments['belajar-javascript-dasar']._id,
    }, 'Notification: Assignment published');
  }

  await disconnectDB();
  console.log('\n=== Seed Complete ===');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
