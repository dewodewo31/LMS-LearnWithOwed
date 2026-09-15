import { Route, Routes } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import { RequireAuth, HomeRedirect } from './routes/Protected';
import LandingPage from './features/landing/LandingPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import AllModulesPage from './features/modules/AllModulesPage';
import ModuleDetailPage from './features/modules/ModuleDetailPage';
import LeaderboardPage from './features/leaderboard/LeaderboardPage';
import TeacherAssignmentPage from './features/assignments/TeacherAssignmentPage';
import SubmissionReviewPage from './features/assignments/SubmissionReviewPage';
import StudentAssignmentPage from './features/assignments/StudentAssignmentPage';
import DashboardPage from './features/dashboard/DashboardPage';
import CoursesPage from './features/courses/CoursesPage';
import CourseFormPage from './features/courses/CourseFormPage';
import CourseManagePage from './features/courses/CourseManagePage';
import StudentsPage from './features/students/StudentsPage';
import EnrollmentsPage from './features/enrollments/EnrollmentsPage';
import StudentDashboardPage from './features/student/StudentDashboardPage';
import StudentCoursePage from './features/student/StudentCoursePage';
import LearnPage from './features/student/LearnPage';
import MyCoursesPage from './features/student/MyCoursesPage';
import ProfilePage from './features/profile/ProfilePage';
import CommunityPage from './features/community/CommunityPage';
import QuestionDetailPage from './features/community/QuestionDetailPage';
import NotificationPage from './features/notifications/NotificationPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/modules" element={<AllModulesPage />} />
      <Route path="/modules/:slug" element={<ModuleDetailPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />

      <Route element={<RequireAuth roles={['admin', 'mentor']} />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/courses" element={<CoursesPage />} />
          <Route path="/dashboard/courses/new" element={<CourseFormPage />} />
          <Route path="/dashboard/courses/:id" element={<CourseManagePage />} />
          <Route path="/dashboard/courses/:id/edit" element={<CourseFormPage />} />
          <Route path="/dashboard/students" element={<StudentsPage />} />
          <Route path="/dashboard/enrollments" element={<EnrollmentsPage />} />
          <Route path="/dashboard/lessons/:lessonId/assignment" element={<TeacherAssignmentPage />} />
          <Route path="/dashboard/assignments/submissions/:submissionId" element={<SubmissionReviewPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth roles={['admin', 'mentor', 'student']} />}>
        <Route element={<AppShell />}>
          <Route path="/student" element={<StudentDashboardPage />} />
          <Route path="/student/courses" element={<MyCoursesPage />} />
          <Route path="/student/assignments/:assignmentId" element={<StudentAssignmentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashboard/courses/:courseId/community" element={<CommunityPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/community/questions/:id" element={<QuestionDetailPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth roles={['student']} />}>
        <Route element={<AppShell />}>
          <Route path="/student/courses/:id" element={<StudentCoursePage />} />
          <Route path="/student/learn/:courseId" element={<LearnPage />} />
          <Route path="/student/courses/:courseId/community" element={<CommunityPage />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
