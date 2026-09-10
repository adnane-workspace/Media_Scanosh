import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Interface: http://localhost:${PORT}`);
  console.log(`Menu API:  http://localhost:${PORT}/library`);
});
