import { createBrowserRouter } from "react-router";
import { Login } from "./screens/Login";
import { UserLayout } from "./layouts/UserLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { Dashboard } from "./screens/user/Dashboard";
import { Horarios } from "./screens/user/Horarios";
import { Asistencias } from "./screens/user/Asistencias";
import { MisPagos } from "./screens/user/MisPagos";
import { Perfil } from "./screens/user/Perfil";
import { AdminDashboard } from "./screens/admin/AdminDashboard";
import { Usuarios } from "./screens/admin/Usuarios";
import { Pagos } from "./screens/admin/Pagos";
import { Clases } from "./screens/admin/Clases";
import { Config } from "./screens/admin/Config";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/user",
    Component: UserLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "horarios", Component: Horarios },
      { path: "asistencias", Component: Asistencias },
      { path: "pagos", Component: MisPagos },
      { path: "perfil", Component: Perfil },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "usuarios", Component: Usuarios },
      { path: "pagos", Component: Pagos },
      { path: "clases", Component: Clases },
      { path: "config", Component: Config },
    ],
  },
]);
