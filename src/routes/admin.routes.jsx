import AdminHome from "../admin/pages/AdminHome";
import CollectionPage from "../admin/pages/CollectionPage";

export default [
  { index: true, element: <AdminHome /> },
  { path: "words", element: <CollectionPage collection="words" idKey="wordId" /> },
  { path: "sentences", element: <CollectionPage collection="sentences" idKey="sentenceId" /> },
  { path: "dialogs", element: <CollectionPage collection="dialogs" idKey="dialogId" /> },
  { path: "grammar", element: <CollectionPage collection="grammar" idKey="grammarId" /> },
];
