const express = require('express');
const db = require('./db');
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// Проверка подключения к БД при старте
db.query('SELECT 1')
  .then(() => console.log('✅ БАЗА ДАННЫХ ПОДКЛЮЧЕНА УСПЕШНО'))
  .catch(err => console.error('❌ ОШИБКА ПОДКЛЮЧЕНИЯ К БАЗЕ:', err.message));

function validateMovie(body, genres) {
  const errors = [];
  const title = (body.title || '').trim();
  const year = Number(body.release_year);
  const duration = Number(body.duration_min);
  const ratingRaw = body.rating === '' || body.rating == null ? null : Number(body.rating);
  const genreId = Number(body.genre_id);

  if (!title) errors.push('Название обязательно.');
  if (!Number.isInteger(year) || year < 1888 || year > 2100) errors.push('Год выпуска некорректен.');
  if (!Number.isInteger(duration) || duration <= 0) errors.push('Длительность некорректна.');
  if (ratingRaw !== null && (Number.isNaN(ratingRaw) || ratingRaw < 0 || ratingRaw > 10)) errors.push('Рейтинг от 0 до 10.');
  if (!genres.some(g => g.id === genreId)) errors.push('Выберите жанр.');

  return {
    errors,
    data: { title, release_year: year, duration_min: duration, rating: ratingRaw, description: (body.description || '').trim() || null, genre_id: genreId },
  };
}

app.get('/', async (req, res, next) => {
  try {
    console.log('Запрос к главной странице...');
    const { rows } = await db.query(`SELECT m.id, m.title, m.release_year, m.duration_min, m.rating, g.name AS genre FROM movies m JOIN genres g ON g.id = m.genre_id ORDER BY m.id DESC`);
    console.log('Данные получены, фильмов:', rows.length);
    res.render('list', { movies: rows });
  } catch (e) { 
    console.error('ОШИБКА НА ГЛАВНОЙ:', e); 
    next(e); 
  }
});

app.get('/movies/new', async (req, res, next) => {
  try {
    const { rows: genres } = await db.query('SELECT * FROM genres ORDER BY name');
    res.render('form', { genres, movie: {}, errors: [], action: '/movies' });
  } catch (e) { next(e); }
});

app.post('/movies', async (req, res, next) => {
  try {
    const { rows: genres } = await db.query('SELECT * FROM genres ORDER BY name');
    const { errors, data } = validateMovie(req.body, genres);
    if (errors.length > 0) return res.status(400).render('form', { genres, errors, action: '/movies', movie: req.body });
    await db.query(`INSERT INTO movies (title, release_year, duration_min, rating, description, genre_id) VALUES ($1, $2, $3, $4, $5, $6)`, [data.title, data.release_year, data.duration_min, data.rating, data.description, data.genre_id]);
    res.redirect('/');
  } catch (e) { next(e); }
});

app.get('/movies/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).render('error', { message: 'Некорректный id.' });
    const { rows } = await db.query(`SELECT m.*, g.name AS genre FROM movies m JOIN genres g ON g.id = m.genre_id WHERE m.id = $1`, [id]);
    if (rows.length === 0) return res.status(404).render('error', { message: 'Фильм не найден.' });
    res.render('item', { movie: rows[0] });
  } catch (e) { next(e); }
});

app.get('/movies/:id/edit', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).render('error', { message: 'Фильм не найден.' });
    const { rows: genres } = await db.query('SELECT * FROM genres ORDER BY name');
    res.render('form', { genres, movie: rows[0], errors: [], action: `/movies/${id}/edit` });
  } catch (e) { next(e); }
});

app.post('/movies/:id/edit', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rows: genres } = await db.query('SELECT * FROM genres ORDER BY name');
    const { errors, data } = validateMovie(req.body, genres);
    if (errors.length > 0) return res.status(400).render('form', { genres, errors, movie: { ...req.body, id }, action: `/movies/${id}/edit` });
    const result = await db.query(`UPDATE movies SET title=$1, release_year=$2, duration_min=$3, rating=$4, description=$5, genre_id=$6 WHERE id=$7`, [data.title, data.release_year, data.duration_min, data.rating, data.description, data.genre_id, id]);
    if (result.rowCount === 0) return res.status(404).render('error', { message: 'Фильм не найден.' });
    res.redirect(`/movies/${id}`);
  } catch (e) { next(e); }
});

app.post('/movies/:id/delete', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.query('DELETE FROM movies WHERE id = $1', [id]);
    res.redirect('/');
  } catch (e) { next(e); }
});

app.use((err, req, res, next) => {
  console.error('ГЛОБАЛЬНАЯ ОШИБКА:', err);
  res.status(500).render('error', { message: 'Ошибка сервера.' });
});

app.listen(PORT, () => console.log(`Сервер запущен: http://localhost:${PORT}`));