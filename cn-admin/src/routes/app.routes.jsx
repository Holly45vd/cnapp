// /src/routes/app.routes.jsx
import AppHome from "../app/pages/AppHome";
import WordSession from "../app/pages/WordSession";
import GrammarSession from "../app/pages/GrammarSession";
import DialogSession from "../app/pages/DialogSession";
import RandomReview from "../app/pages/RandomReview";
import History from "../app/pages/History";
import MyPage from "../app/pages/MyPage";

import TodayStudySession from "../app/pages/TodayStudySession";
import DoneToday from "../app/pages/DoneToday";

export default [
  // 홈
  { index: true, element: <AppHome /> },

  // 오늘 공부 묶음
  {
    path: "today",
    children: [
      { index: true, element: <TodayStudySession /> },
      { path: "grammar", element: <GrammarSession mode="today" /> },
      { path: "dialogs", element: <DialogSession mode="today" /> },
      { path: "done", element: <DoneToday /> },
    ],
  },

  // (옵션) 단독 진입 라우트 유지
  { path: "words", element: <WordSession /> },
  { path: "grammar", element: <GrammarSession /> },
  { path: "dialogs", element: <DialogSession /> },

  // 복습/기록/마이
  { path: "review", element: <RandomReview /> },
  { path: "history", element: <History /> },
  { path: "mypage", element: <MyPage /> },
];
