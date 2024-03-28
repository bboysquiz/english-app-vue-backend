create TABLE dictionary(
    id SERIAL PRIMARY KEY,
    word VARCHAR(255),
    translation VARCHAR(255)
);
CREATE TABLE users (
    username VARCHAR(255) NOT NULL,
    points INT DEFAULT 0,
    correct_words INT DEFAULT 0,
    incorrect_words INT DEFAULT 0
);