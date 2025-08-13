import { Box, Typography, Button, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { tokens } from "../../theme";

const LoadReport = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [reports, setReports] = useState({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("savedReports") || "{}");
      setReports(saved);
    } catch (err) {
      console.error("Failed to load saved reports", err);
    }
  }, []);

  const handleLoad = (name, report) => {
    localStorage.setItem("loadedReport", JSON.stringify(report));
    navigate("/");
  };

  const reportNames = Object.keys(reports);

  return (
    <Box m="20px">
      <Header title="LOAD REPORT" subtitle="Select a report to load" />
      <Box display="flex" flexDirection="column" gap="20px" mt="20px">
        {reportNames.length === 0 ? (
          <Typography>No saved reports available.</Typography>
        ) : (
          reportNames.map((name) => (
            <Button
              key={name}
              variant="contained"
              onClick={() => handleLoad(name, reports[name])}
              sx={{
                alignSelf: "flex-start",
                backgroundColor: colors.greenAccent[700],
                color: colors.grey[100],
                textTransform: "none",
                fontSize: "16px",
                fontWeight: "bold",
                '&:hover': { backgroundColor: colors.greenAccent[500] },
              }}
            >
              {name}
            </Button>
          ))
        )}
      </Box>
    </Box>
  );
};

export default LoadReport;
