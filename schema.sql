DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS genres;

CREATE TABLE genres (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE movies (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    release_year INTEGER NOT NULL CHECK (release_year BETWEEN 1888 AND 2100),
    duration_min INTEGER NOT NULL CHECK (duration_min > 0),
    rating       NUMERIC(3,1) CHECK (rating >= 0 AND rating <= 10),
    description  TEXT,
    genre_id     INTEGER NOT NULL REFERENCES genres(id) ON DELETE RESTRICT
);

INSERT INTO genres (name) VALUES
    ('Драма'),
    ('Комедия'),
    ('Фантастика'),
    ('Триллер');

INSERT INTO movies (title, release_year, duration_min, rating, description, genre_id)
VALUES
    ('Начало', 2010, 148, 8.8, 'Сон внутри сна.', 3),
    ('Интерстеллар', 2014, 169, 8.6, 'Путешествие сквозь червоточину.', 3);