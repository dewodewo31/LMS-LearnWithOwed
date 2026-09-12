const { request, app, createUser, loginAs, createCourse, addLesson } = require('./helpers');
const Course = require('../src/models/Course');

describe('Public courses endpoint (GET /api/v1/public/courses)', () => {
  test('no auth required; returns published course with public fields only', async () => {
    const mentor = await createUser({ role: 'mentor' });
    await createCourse(mentor._id, { title: 'Public JS', status: 'published' });

    const res = await request(app).get('/api/v1/public/courses');
    expect(res.status).toBe(200);
    expect(res.body.data.courses).toHaveLength(1);
    const c = res.body.data.courses[0];
    expect(c.id).toBeDefined();
    expect(c.title).toBe('Public JS');
    expect(c.slug).toBeDefined();
    expect(c.shortDescription).toBeDefined();
    expect(c.thumbnail).toBeDefined();
    expect(c.category).toBeDefined();
    expect(c.level).toBe('beginner');
    expect(c.totalLessons).toBeDefined();
    expect(c.publishedAt).toBeDefined();
    // private/internal fields never exposed
    expect(c.status).toBeUndefined();
    expect(c.description).toBeUndefined();
    expect(c.mentor).toBeUndefined();
    expect(c.mentorId).toBeUndefined();
    expect(c.requirements).toBeUndefined();
    expect(c.learningObjectives).toBeUndefined();
    expect(c.isDeleted).toBeUndefined();
  });

  test('excludes drafts, archived, and soft-deleted courses', async () => {
    const mentor = await createUser({ role: 'mentor' });
    await createCourse(mentor._id, { title: 'Draft Course', status: 'draft' });
    await createCourse(mentor._id, { title: 'Archived Course', status: 'archived' });
    const deleted = await createCourse(mentor._id, { title: 'Deleted Course', status: 'published' });
    await Course.updateOne({ _id: deleted._id }, { isDeleted: true });

    const res = await request(app).get('/api/v1/public/courses');
    expect(res.status).toBe(200);
    expect(res.body.data.courses).toHaveLength(0);
    expect(res.body.meta.total).toBe(0);
  });

  test('returns a module without lesson count accurately', async () => {
    const mentor = await createUser({ role: 'mentor' });
    const course = await createCourse(mentor._id, { title: 'With Lessons', status: 'published' });
    await addLesson(course._id, 1);
    await addLesson(course._id, 2);
    await Course.updateOne({ _id: course._id }, { totalLessons: 2 });

    const res = await request(app).get('/api/v1/public/courses');
    expect(res.body.data.courses[0].totalLessons).toBe(2);
  });

  test('sorts newest published first', async () => {
    const mentor = await createUser({ role: 'mentor' });
    const a = await createCourse(mentor._id, { title: 'Older Course', status: 'published' });
    const b = await createCourse(mentor._id, { title: 'Newer Course', status: 'published' });
    await Course.updateOne({ _id: a._id }, { publishedAt: new Date('2026-01-01') });
    await Course.updateOne({ _id: b._id }, { publishedAt: new Date('2026-02-01') });

    const res = await request(app).get('/api/v1/public/courses');
    expect(res.body.data.courses.map((c) => c.title)).toEqual(['Newer Course', 'Older Course']);
  });

  test('supports pagination via page/limit', async () => {
    const mentor = await createUser({ role: 'mentor' });
    await createCourse(mentor._id, { title: 'First Course', status: 'published' });
    await createCourse(mentor._id, { title: 'Second Course', status: 'published' });

    const res = await request(app).get('/api/v1/public/courses?limit=1');
    expect(res.status).toBe(200);
    expect(res.body.data.courses).toHaveLength(1);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.meta.totalPages).toBe(2);
  });
});

describe('Public random courses endpoint (GET /api/v1/public/courses/random)', () => {
  test('returns at most limit courses drawn from published set, with public fields only', async () => {
    const mentor = await createUser({ role: 'mentor' });
    await createCourse(mentor._id, { title: 'Random A', status: 'published' });
    await createCourse(mentor._id, { title: 'Random B', status: 'published' });
    await createCourse(mentor._id, { title: 'Random Draft', status: 'draft' });
    const deleted = await createCourse(mentor._id, { title: 'Random Deleted', status: 'published' });
    await Course.updateOne({ _id: deleted._id }, { isDeleted: true });

    const res = await request(app).get('/api/v1/public/courses/random?limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data.courses).toHaveLength(2);
    const titles = res.body.data.courses.map((c) => c.title);
    expect(new Set(titles).size).toBe(2);
    titles.forEach((t) => expect(['Random A', 'Random B']).toContain(t));
    const c = res.body.data.courses[0];
    expect(c.status).toBeUndefined();
    expect(c.description).toBeUndefined();
    expect(c.mentor).toBeUndefined();
  });

  test('returns exact platform stats over the full published dataset', async () => {
    const mentor = await createUser({ role: 'mentor' });
    const a = await createCourse(mentor._id, { title: 'Stats A', status: 'published', category: 'Programming' });
    await createCourse(mentor._id, { title: 'Stats B', status: 'published', category: 'Frontend' });
    await addLesson(a._id, 1);
    await addLesson(a._id, 2);
    await Course.updateOne({ _id: a._id }, { totalLessons: 2 });

    const res = await request(app).get('/api/v1/public/courses/random');
    expect(res.status).toBe(200);
    expect(res.body.data.stats).toEqual({ totalCourses: 2, totalLessons: 2, categories: 2 });
  });

  test('returns empty stats and courses when nothing is published', async () => {
    const res = await request(app).get('/api/v1/public/courses/random');
    expect(res.status).toBe(200);
    expect(res.body.data.courses).toEqual([]);
    expect(res.body.data.stats).toEqual({ totalCourses: 0, totalLessons: 0, categories: 0 });
  });
});

describe('Public course detail endpoint (GET /api/v1/public/courses/:slug)', () => {
  test('returns public detail with ordered published lessons and no private fields', async () => {
    const mentor = await createUser({ role: 'mentor' });
    const course = await createCourse(mentor._id, {
      title: 'Detail Course',
      status: 'published',
      description: '<p>Tentang kursus</p>',
      requirements: ['Dasar JS'],
      learningObjectives: ['Golang', 'Docker'],
    });
    await addLesson(course._id, 2);
    await addLesson(course._id, 1);

    const res = await request(app).get(`/api/v1/public/courses/${course.slug}`);
    expect(res.status).toBe(200);
    const c = res.body.data.course;
    expect(c.title).toBe('Detail Course');
    expect(c.slug).toBe(course.slug);
    expect(c.description).toContain('<p>Tentang kursus</p>');
    expect(c.description).not.toContain('<script>');
    expect(c.requirements).toEqual(['Dasar JS']);
    expect(c.learningObjectives).toEqual(['Golang', 'Docker']);
    // private fields never exposed
    expect(c.mentorId).toBeUndefined();
    expect(c.price).toBeUndefined();
    expect(c.status).toBeUndefined();
    expect(c.isDeleted).toBeUndefined();

    const lessons = res.body.data.lessons;
    expect(lessons.map((l) => l.order)).toEqual([1, 2]);
    expect(lessons[0].title).toBeDefined();
    expect(lessons[0].contentType).toBeDefined();
    // lesson content stays private
    expect(lessons[0].textContent).toBeUndefined();
    expect(lessons[0].youtubeUrl).toBeUndefined();
    expect(lessons[0].youtubeVideoId).toBeUndefined();
  });

  test('hides unpublished lessons from syllabus', async () => {
    const mentor = await createUser({ role: 'mentor' });
    const course = await createCourse(mentor._id, { title: 'Hidden Lesson Course', status: 'published' });
    await addLesson(course._id, 1);
    const draft = await addLesson(course._id, 2, { isPublished: false });

    const res = await request(app).get(`/api/v1/public/courses/${course.slug}`);
    expect(res.body.data.lessons).toHaveLength(1);
    expect(res.body.data.lessons[0].id).not.toBe(String(draft._id));
  });

  test('description is sanitized end-to-end when written through the API', async () => {
    const { agent } = await loginAs({ role: 'mentor' });
    const created = await agent.post('/api/v1/courses').send({
      title: 'Sanitized Detail Course',
      level: 'beginner',
      description: '<p>Aman</p><script>alert(1)</script>',
      thumbnail: '/uploads/course.webp',
    });
    expect(created.status).toBe(201);
    const slug = created.body.data.course.slug;
    await addLesson(created.body.data.course.id, 1);
    const published = await agent.post(`/api/v1/courses/${created.body.data.course.id}/publish`).send({});
    expect(published.status).toBe(200);

    const res = await request(app).get(`/api/v1/public/courses/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.course.description).toContain('<p>Aman</p>');
    expect(res.body.data.course.description).not.toContain('<script>');
  });

  test('404 for unknown slug, draft, archived, or deleted course', async () => {
    const mentor = await createUser({ role: 'mentor' });
    const draft = await createCourse(mentor._id, { title: 'Draft Detail', status: 'draft' });
    const archived = await createCourse(mentor._id, { title: 'Archived Detail', status: 'archived' });
    const deleted = await createCourse(mentor._id, { title: 'Deleted Detail', status: 'published' });
    await Course.updateOne({ _id: deleted._id }, { isDeleted: true });

    const unknown = await request(app).get('/api/v1/public/courses/tidak-ada');
    expect(unknown.status).toBe(404);
    expect((await request(app).get(`/api/v1/public/courses/${draft.slug}`)).status).toBe(404);
    expect((await request(app).get(`/api/v1/public/courses/${archived.slug}`)).status).toBe(404);
    expect((await request(app).get(`/api/v1/public/courses/${deleted.slug}`)).status).toBe(404);
  });
});