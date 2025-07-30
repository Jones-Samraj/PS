import React from "react";
import Snackbar from "@mui/material/Snackbar";

export default function PositionedSnackbar({ message, trigger }) {
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState({
    vertical: "top",
    horizontal: "center",
  });

  const { vertical, horizontal } = state;

  React.useEffect(() => {
    if (message) {
      setOpen(true);
    }
  }, [trigger, message]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Snackbar
      anchorOrigin={{ vertical, horizontal }}
      open={open}
      onClose={handleClose}
      message={message}
      key={vertical + horizontal}
      autoHideDuration={3000}
    />
  );
}
