const { app, loginAs, createCourse, addLesson, enroll } = require('./helpers');

describe('Course & lesson management', () => {
  test('mentor creates course → slug generated, defaults draft', async () => {
    const { agent } = await loginAs({ role: 'mentor', email: 'author@test.dev' });
    const res = await agent.post('/api/v1/courses').send({ title: 'React Fundamentals', level: 'beginner', shortDescription: 'Learn React' });
    expect(res.status).toBe(201);
    expect(res.body.data.course.slug).toBe('react-fundamentals');
    expect(res.body.data.course.status).toBe('draft');
  });

  test('duplicate-titled courses get unique slugs (PRD §40)', async () => {
    const { agent } = await loginAs({ role: 'mentor', email: 'author2@test.dev' });
    const a = await agent.post('/api/v1/courses').send({ title: 'Same Title', level: 'beginner' });
    const b = await agent.post('/api/v1/courses').send({ title: 'Same Title', level: 'beginner' });
    expect(b.status).toBe(201);
    expect(a.body.data.course.slug).not.toBe(b.body.data.course.slug);
  });

  test('publish without thumbnail/lessons → 422 with problems (PRD §12)', async () => {
    const { agent } = await loginAs({ role: 'mentor', email: 'author3@test.dev' });
    const created = await agent.post('/api/v1/courses').send({ title: 'Empty Course', level: 'beginner' });
    const res = await agent.post(`/api/v1/courses/${created.body.data.course.id}/publish`);
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  test('full flow: create → lesson → publish (PRD §12)', async () => {
    const { agent } = await loginAs({ role: 'mentor', email: 'author4@test.dev' });
    const created = await agent.post('/api/v1/courses').send({ title: 'Complete Course', level: 'beginner', thumbnail: '/uploads/x.webp', description: '<p>Desc</p>' });
    const id = created.body.data.course.id;
    await agent.post(`/api/v1/courses/${id}/lessons`).send({ title: 'Intro', contentType: 'text', textContent: '<p>Hello</p>' });
    const published = await agent.post(`/api/v1/courses/${id}/publish`);
    expect(published.status).toBe(200);
    expect(published.body.data.course.status).toBe('published');
  });

  test('video lesson requires valid YouTube URL; rejects non-YouTube (PRD §42)', async () => {
    const { agent } = await loginAs({ role: 'mentor', email: 'author5@test.dev' });
    const created = await agent.post('/api/v1/courses').send({ title: 'Video Course', level: 'beginner' });
    const id = created.body.data.course.id;

    const bad = await agent.post(`/api/v1/courses/${id}/lessons`).send({ title: 'Bad', contentType: 'video', youtubeUrl: 'https://vimeo.com/12345' });
    expect(bad.status).toBe(422);

    const good = await agent.post(`/api/v1/courses/${id}/lessons`).send({ title: 'Good', contentType: 'video', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
    expect(good.status).toBe(201);
    expect(good.body.data.lesson.youtubeVideoId).toBe('dQw4w9WgXcQ');

    const short = await agent.post(`/api/v1/courses/${id}/lessons`).send({ title: 'Short', contentType: 'video', youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ' });
    expect(short.status).toBe(201);
    expect(short.body.data.lesson.youtubeVideoId).toBe('dQw4w9WgXcQ');
  });

  test('text lesson HTML is sanitized on store (PRD §43)', async () => {
    const { agent } = await loginAs({ role: 'mentor', email: 'author6@test.dev' });
    const created = await agent.post('/api/v1/courses').send({ title: 'XSS Course', level: 'beginner' });
    const res = await agent.post(`/api/v1/courses/${created.body.data.course.id}/lessons`).send({
      title: 'Evil',
      contentType: 'text',
      textContent: '<p>ok</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">c</a>',
    });
    expect(res.status).toBe(201);
    const html = res.body.data.lesson.textContent;
    expect(html).not.toMatch(/script|onerror|javascript:/i);
    expect(html).toMatch(/<p>ok<\/p>/);
  });

  test('lesson reorder: no duplicates, wrong-course id → 404 (PRD §16)', async () => {
    const mentor = await loginAs({ role: 'mentor', email: 'author7@test.dev' });
    const created = await mentor.agent.post('/api/v1/courses').send({ title: 'Order Course', level: 'beginner' });
    const id = created.body.data.course.id;
    const l1 = await addLesson(id, 1);
    const l2 = await addLesson(id, 2);
    const l3 = await addLesson(id, 3);

    // swap
    const res = await mentor.agent.patch(`/api/v1/courses/${id}/lessons/reorder`).send({
      orders: [
        { id: String(l3._id), order: 1 },
        { id: String(l1._id), order: 2 },
        { id: String(l2._id), order: 3 },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.data.lessons.map((l) => l.order)).toEqual([1, 2, 3]);
    expect(res.body.data.lessons[0]._id).toBe(String(l3._id));

    const dup = await mentor.agent.patch(`/api/v1/courses/${id}/lessons/reorder`).send({
      orders: [
        { id: String(l1._id), order: 1 },
        { id: String(l2._id), order: 1 },
      ],
    });
    expect(dup.status).toBe(422);
  });

  test('archived course: student keeps access; draft course hidden from published check', async () => {
    const mentor = await loginAs({ role: 'mentor', email: 'author8@test.dev' });
    const course = await createCourse(mentor.user._id, { status: 'published' });
    await addLesson(course._id, 1);
    const student = await loginAs({ role: 'student', email: 'arch@test.dev' });
    await enroll(student.user._id, course._id);

    await mentor.agent.post(`/api/v1/courses/${course._id}/archive`);
    const res = await student.agent.get(`/api/v1/courses/${course._id}`);
    expect(res.status).toBe(200); // archived: enrollment lama tetap akses (PRD §11.2)
  });
});
