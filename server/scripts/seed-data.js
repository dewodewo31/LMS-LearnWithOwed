/* Seed: course data + enrollments + community Q&A for development.
 * Idempotent — skips data that already exists. Usage: npm run seed:data
 */
const { connectDB, disconnectDB } = require('../src/config/db');
const config = require('../src/config/env');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const Enrollment = require('../src/models/Enrollment');
const Question = require('../src/models/Question');
const Answer = require('../src/models/Answer');

const upsertUser = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({ name, email, password, role });
};

const upsertCourse = async (data) => {
  const existing = await Course.findOne({ slug: data.slug });
  if (existing) { console.log(`- exists: course "${existing.title}"`); return existing; }
  const course = await Course.create(data);
  console.log(`+ created: course "${course.title}"`);
  return course;
};

const upsertLesson = async (data) => {
  const existing = await Lesson.findOne({ courseId: data.courseId, order: data.order });
  if (existing) return existing;
  return Lesson.create(data);
};

const upsertEnrollment = async (data) => {
  const existing = await Enrollment.findOne({ studentId: data.studentId, courseId: data.courseId });
  if (existing) return existing;
  return Enrollment.create(data);
};

const upsertQuestion = async (data) => {
  const existing = await Question.findOne({ courseId: data.courseId, title: data.title });
  if (existing) return existing;
  return Question.create(data);
};

const upsertAnswer = async (data) => {
  const existing = await Answer.findOne({ questionId: data.questionId, authorId: data.authorId });
  if (existing) return existing;
  return Answer.create(data);
};

const syncTotalLessons = async (courseId) => {
  const totalLessons = await Lesson.countDocuments({ courseId });
  await Course.updateOne({ _id: courseId }, { totalLessons });
};

// ── Course Data ──────────────────────────────────────────────────────

const COURSES = [
  {
    title: 'Belajar JavaScript Dasar',
    slug: 'belajar-javascript-dasar',
    shortDescription: 'Pelajari fundamental JavaScript dari nol hingga mahir.',
    description: '<p>Kursus ini membahas variabel, tipe data, fungsi, array, object, DOM manipulation, dan async/await.</p>',
    category: 'Programming',
    level: 'beginner',
    language: 'id',
    status: 'published',
    price: 0,
    requirements: ['Komputer/laptop', 'Browser modern'],
    learningObjectives: ['Memahami variabel dan tipe data', 'Menguasai fungsi dan scope', 'Manipulasi DOM dengan JavaScript', 'Menggunakan async/await'],
    publishedAt: new Date(),
  },
  {
    title: 'React Fundamentals',
    slug: 'react-fundamentals',
    shortDescription: 'Membangun UI interaktif dengan React.js.',
    description: '<p>Kursus mencakup JSX, components, props, state, hooks, dan routing.</p>',
    category: 'Frontend',
    level: 'intermediate',
    language: 'id',
    status: 'published',
    price: 0,
    requirements: ['Kemampuan JavaScript dasar', 'Node.js terinstall'],
    learningObjectives: ['Membuat React components', 'Menggunakan hooks (useState, useEffect)', 'React Router untuk navigasi', 'State management dengan Context'],
    publishedAt: new Date(),
  },
  {
    title: 'Node.js & Express API',
    slug: 'nodejs-express-api',
    shortDescription: 'Membangun RESTful API dengan Node.js dan Express.',
    description: '<p>Pelajari routing, middleware, authentication, validation, dan MongoDB integration.</p>',
    category: 'Backend',
    level: 'intermediate',
    language: 'id',
    status: 'published',
    price: 0,
    requirements: ['JavaScript dasar', 'Node.js 18+'],
    learningObjectives: ['Membuat Express server', 'Implementasi JWT auth', 'Validasi input dengan Zod', 'CRUD dengan MongoDB/Mongoose'],
    publishedAt: new Date(),
  },
  {
    title: 'Database Design & MongoDB',
    slug: 'database-design-mongodb',
    shortDescription: 'Prinsip desain database dan penggunaan MongoDB.',
    description: '<p>Mencakup schema design, indexing, aggregation, dan best practices.</p>',
    category: 'Database',
    level: 'beginner',
    language: 'id',
    status: 'published',
    price: 0,
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
    requirements: ['JavaScript intermediate'],
    learningObjectives: ['Type annotations & interfaces', 'Generics dan utility types', 'TypeScript dengan React', 'TypeScript dengan Node.js'],
    publishedAt: new Date(),
  },
  {
    title: 'UI/UX Design Principles',
    slug: 'ui-ux-design-principles',
    shortDescription: 'Prinsip desain antarmuka yang baik dan user experience.',
    description: '<p>Color theory, typography, layout, responsive design, dan accessibility.</p>',
    category: 'Design',
    level: 'beginner',
    language: 'id',
    status: 'draft',
    price: 0,
    requirements: [],
    learningObjectives: ['Color theory dan palette', 'Typography yang baik', 'Responsive layout', 'Accessibility basics'],
    publishedAt: null,
  },
];

// ── Lesson Data ──────────────────────────────────────────────────────

const LESSONS_DATA = {
  'belajar-javascript-dasar': [
    { title: 'Pengenalan JavaScript', contentType: 'text', duration: 10, textContent: '<p>JavaScript adalah bahasa pemrograman yang digunakan untuk membuat website interaktif.</p>' },
    { title: 'Variabel dan Tipe Data', contentType: 'text', duration: 15, textContent: '<p>var, let, const — Number, String, Boolean, null, undefined.</p>' },
    { title: 'Operator di JavaScript', contentType: 'text', duration: 12, textContent: '<p>Arithmetic, comparison, logical, dan assignment operators.</p>' },
    { title: 'Fungsi dan Scope', contentType: 'text', duration: 18, textContent: '<p>Function declaration, expression, arrow function, dan scope chain.</p>' },
    { title: 'Array dan Object', contentType: 'text', duration: 20, textContent: '<p>Manipulasi array (map, filter, reduce) dan object destructuring.</p>' },
    { title: 'DOM Manipulation', contentType: 'video', duration: 25, youtubeUrl: 'https://www.youtube.com/watch?v=0ik6X4DJKCc' },
    { title: 'Event Handling', contentType: 'video', duration: 20, youtubeUrl: 'https://www.youtube.com/watch?v=XF1_MlS6vBw' },
    { title: 'Async JavaScript', contentType: 'text', duration: 22, textContent: '<p>Callbacks, Promises, async/await, dan error handling.</p>' },
  ],
  'react-fundamentals': [
    { title: 'Apa itu React?', contentType: 'text', duration: 8, textContent: '<p>React adalah library UI dari Facebook untuk membangun antarmuka interaktif.</p>' },
    { title: 'JSX dan Component', contentType: 'text', duration: 12, textContent: '<p>JSX adalah syntax extension, component adalah blok bangunan UI.</p>' },
    { title: 'Props dan State', contentType: 'text', duration: 15, textContent: '<p>Props untuk data passing, state untuk data internal component.</p>' },
    { title: 'Hooks: useState & useEffect', contentType: 'video', duration: 20, youtubeUrl: 'https://www.youtube.com/watch?v=dpw9EHDh2bM' },
    { title: 'React Router', contentType: 'text', duration: 14, textContent: '<p>Navigasi antar halaman dengan React Router v6.</p>' },
    { title: 'Context API', contentType: 'text', duration: 16, textContent: '<p>Shared state tanpa prop drilling menggunakan Context.</p>' },
  ],
  'nodejs-express-api': [
    { title: 'Mengenal Node.js', contentType: 'text', duration: 10, textContent: '<p>Node.js adalah runtime JavaScript di server.</p>' },
    { title: 'Express.js Dasar', contentType: 'text', duration: 15, textContent: '<p>Routing, middleware, dan request/response cycle.</p>' },
    { title: 'RESTful API Design', contentType: 'text', duration: 18, textContent: '<p>GET, POST, PUT, PATCH, DELETE — status codes, URL structure.</p>' },
    { title: 'Authentication dengan JWT', contentType: 'video', duration: 22, youtubeUrl: 'https://www.youtube.com/watch?v=mbskti-1PiI' },
    { title: 'Input Validation', contentType: 'text', duration: 14, textContent: '<p>Validasi input dengan Zod untuk keamanan data.</p>' },
    { title: 'MongoDB dengan Mongoose', contentType: 'video', duration: 25, youtubeUrl: 'https://www.youtube.com/watch?v=5dqrKOwJqgI' },
    { title: 'Error Handling', contentType: 'text', duration: 12, textContent: '<p>Global error handler, custom ApiError, dan async wrapper.</p>' },
  ],
  'database-design-mongodb': [
    { title: 'Pengenalan Database', contentType: 'text', duration: 10, textContent: '<p>SQL vs NoSQL, relational vs document-based.</p>' },
    { title: 'Schema Design', contentType: 'text', duration: 18, textContent: '<p>Embedded vs referenced, data modeling patterns.</p>' },
    { title: 'Indexing', contentType: 'text', duration: 15, textContent: '<p>Single field, compound, dan text indexes untuk performa query.</p>' },
    { title: 'Aggregation Pipeline', contentType: 'video', duration: 20, youtubeUrl: 'https://www.youtube.com/watch?v=VwDKo_0fhY4' },
    { title: 'MongoDB Best Practices', contentType: 'text', duration: 12, textContent: '<p>Validation rules, transactions, dan backup strategies.</p>' },
  ],
  'typescript-untuk-pengembang': [
    { title: 'Pengenalan TypeScript', contentType: 'text', duration: 10, textContent: '<p>TypeScript = JavaScript + static typing.</p>' },
    { title: 'Type Annotations', contentType: 'text', duration: 15, textContent: '<p>Primitive types, arrays, objects, union, intersection.</p>' },
    { title: 'Interfaces dan Types', contentType: 'text', duration: 14, textContent: '<p>Defining shapes, extending, dan optional properties.</p>' },
    { title: 'Generics', contentType: 'video', duration: 18, youtubeUrl: 'https://www.youtube.com/watch?v=nVi7PtT1a0Q' },
    { title: 'Utility Types', contentType: 'text', duration: 12, textContent: '<p>Partial, Pick, Omit, Record, ReturnType.</p>' },
  ],
};

// ── Community Q&A ────────────────────────────────────────────────────

const QUESTIONS = [
  { title: 'Apa bedanya let dan const?', body: 'Saya masih bingung kapan harus pakai let vs const. Bisa dijelaskan?', answer: 'const untuk variabel yang tidak di-reassign, let untuk yang berubah. Keduanya block-scoped, berbeda dengan var.' },
  { title: 'Kenapa async/await lebih baik dari callback?', body: 'Apa keuntungan async/await dibanding callback?', answer: 'Kode lebih readable, error handling lebih mudah dengan try/catch, dan menghindari callback hell.' },
  { title: 'Bagaimana cara protect route di Express?', body: 'Saya ingin membuat route yang hanya bisa diakses user login.', answer: 'Gunakan middleware authenticate yang verify JWT, lalu apply di route yang ingin dilindungi.' },
  { title: 'React hooks boleh dipanggil conditional?', body: 'Apakah boleh pakai hooks di dalam if/else?', answer: 'Tidak boleh. Hooks harus dipanggil di top level component, tidak boleh conditional. Gunakan early return sebelum hooks.' },
];

// ── Main Seed ────────────────────────────────────────────────────────

(async () => {
  await connectDB(config.mongoUri);
  console.log('=== Seeding course data ===\n');

  // 1. Upsert users
  console.log('── Users ──');
  const admin = await upsertUser({ name: 'Administrator', email: 'admin@lms.test', password: 'admin12345', role: 'admin' });
  const mentor = await upsertUser({ name: 'Demo Mentor', email: 'mentor@lms.test', password: 'mentor12345', role: 'mentor' });
  const student = await upsertUser({ name: 'Demo Student', email: 'student@lms.test', password: 'student12345', role: 'student' });

  // 2. Upsert courses
  console.log('\n── Courses ──');
  const courses = [];
  for (const c of COURSES) {
    courses.push(await upsertCourse({ ...c, mentorId: mentor._id }));
  }

  // 3. Upsert lessons
  console.log('\n── Lessons ──');
  for (const course of courses) {
    const lessons = LESSONS_DATA[course.slug] || [];
    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      let youtubeVideoId = null;
      if (l.youtubeUrl) {
        const match = l.youtubeUrl.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
        if (match) youtubeVideoId = match[1];
      }
      await upsertLesson({
        courseId: course._id,
        title: l.title,
        contentType: l.contentType,
        textContent: l.textContent || null,
        youtubeUrl: l.youtubeUrl || null,
        youtubeVideoId,
        duration: l.duration,
        order: i + 1,
        isPublished: true,
      });
    }
    await syncTotalLessons(course._id);
  }

  // 4. Enroll student in all published courses
  console.log('\n── Enrollments ──');
  for (const course of courses) {
    if (course.status === 'published') {
      await upsertEnrollment({
        studentId: student._id,
        courseId: course._id,
        source: 'admin',
        status: 'active',
      });
      console.log(`+ enrolled: student → "${course.title}"`);
    }
  }

  // 5. Community Q&A
  console.log('\n── Community Q&A ──');
  const targetCourse = courses[0]; // JavaScript course
  for (const q of QUESTIONS) {
    const question = await upsertQuestion({
      courseId: targetCourse._id,
      authorId: student._id,
      title: q.title,
      body: q.body,
    });
    await upsertAnswer({
      questionId: question._id,
      authorId: mentor._id,
      body: q.answer,
      isVerified: true,
    });
    console.log(`+ Q&A: "${q.title}"`);
  }

  await disconnectDB();
  console.log('\nDone.');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
