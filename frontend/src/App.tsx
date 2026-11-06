
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";

// App is intentionally thin; routing and providers are composed in main.tsx.
export default function App() {
  return <RouterProvider router={router} />;
}

