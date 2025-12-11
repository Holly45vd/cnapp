import AdminHome from "../admin/pages/AdminHome";
import CollectionPage from "../admin/pages/CollectionPage";
import HskImportPage from "../admin/pages/HskImportPage";
import HskMissingWords from "../admin/pages/HskMissingWords";

export default [
  { index: true, element: <AdminHome /> },
  { path: "words", element: <CollectionPage collection="words" idKey="wordId" /> },
  { path: "sentences", element: <CollectionPage collection="sentences" idKey="sentenceId" /> },
  { path: "dialogs", element: <CollectionPage collection="dialogs" idKey="dialogId" /> },
  { path: "grammar", element: <CollectionPage collection="grammar" idKey="grammarId" /> },
  // 🔹 HSK 업로드 전용 페이지
  {
    path: "hsk-import",
    element: <HskImportPage />,
  },
    { path: "hsk-missing", element: <HskMissingWords /> },
];
