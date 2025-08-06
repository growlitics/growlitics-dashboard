import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";
import ProgressCircle from "./ProgressCircle";

const StatBox = ({ title, lines, subtitle, icon, progress, increase }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box width="100%" m="0 30px">
      <Box display="flex" justifyContent="space-between">
        <Box>
          {icon}
          {lines
            ? lines.map((line, idx) => (
                <Typography
                  key={idx}
                  variant="h4"
                  fontWeight="bold"
                  sx={{ color: line.color }}
                >
                  {line.label}
                </Typography>
              ))
            : (
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{ color: colors.grey[100] }}
                >
                  {title}
                </Typography>
              )}
        </Box>
        {progress !== undefined && (
          <Box>
            <ProgressCircle progress={progress} />
          </Box>
        )}
      </Box>
      <Box display="flex" justifyContent="space-between" mt="2px">
        <Typography variant="h5" sx={{ color: colors.greenAccent[500] }}>
          {subtitle}
        </Typography>
        {increase && (
          <Typography
            variant="h5"
            fontStyle="italic"
            sx={{ color: colors.greenAccent[600] }}
          >
            {increase}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default StatBox;
