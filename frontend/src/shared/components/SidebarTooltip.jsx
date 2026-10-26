// src/shared/components/SidebarTooltip.jsx
import React from "react";
import { Tooltip } from "@mui/material";
import "./SidebarTooltip.css";

export default function SidebarTooltip(props) {
  return (
    <Tooltip
      placement="right"
      arrow
      classes={{ tooltip: "cb-tooltip", arrow: "cb-tooltip-arrow" }}
      {...props}
    />
  );
}