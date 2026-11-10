import { roleLabel } from "../utils/roles";
import "./RoleBadge.css";

export default function RoleBadge({ role, options }) {
  return (
    <span className={`role-badge role-badge--${role}`}>
      {roleLabel(role, options)}
    </span>
  );
}
