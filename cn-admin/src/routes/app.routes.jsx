import AppHome from "../app/pages/AppHome";
import WordSession from "../app/pages/WordSession";
import GrammarSession from "../app/pages/GrammarSession";
import DialogSession from "../app/pages/DialogSession";
import RandomReview from "../app/pages/RandomReview";
import History from "../app/pages/History";
import MyPage from "../app/pages/MyPage";

export default [
  { index: true, element: <AppHome /> },
  { path: "words", element: <WordSession /> },
  { path: "grammar", element: <GrammarSession /> },
  { path: "dialogs", element: <DialogSession /> },
  { path: "review", element: <RandomReview /> },
  { path: "history", element: <History /> },
  { path: "mypage", element: <MyPage /> },
];
