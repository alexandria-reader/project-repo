/* eslint-disable max-len */
import { QueryResult } from 'pg';
import dbQuery from '../model/db-query';
import { Word } from '../types';


// Returning all words in the database is most likely not needed
const getAll = async function(): Promise<QueryResult> {
  const ALL_WORDS: string = `
    SELECT * FROM words`;

  const result = await dbQuery(ALL_WORDS);

  return result;
};


const getById = async function(wordId: number): Promise<QueryResult> {
  const WORD_BY_ID: string = `
    SELECT * FROM words 
    WHERE id = %L`;

  const result = await dbQuery(WORD_BY_ID, wordId);

  return result;
};


// Finds all words in a given language that are connected to the user
const getByLanguageAndUser = async function(languageId: string, userId: number): Promise<QueryResult> {
  const WORDS_BY_LANGUAGE_AND_USER: string = `
    SELECT w.id, w.language_id, w.word FROM words AS w 
      JOIN users_words AS uw 
        ON w.id = uw.word_id 
     WHERE w.language_id = %L 
           AND 
           uw.user_id = %L`;

  const result = await dbQuery(
    WORDS_BY_LANGUAGE_AND_USER,
    languageId,
    userId,
  );

  return result;
};


const getUserwordsInText = async function(userId: number, textId: number, simple: boolean = true): Promise<QueryResult> {
  const tsvectorType = simple ? 'simple' : 'language';

  const USER_WORDS_IN_TEXT: string = `
    SELECT w.id, w.word
      FROM words AS w
      JOIN users_words AS uw ON w.id = uw.word_id
     WHERE uw.user_id = %s 
           AND
           w.language_id = (SELECT t.language_id FROM texts AS t 
                             WHERE t.id = %s)
           AND
           w.tsquery_${tsvectorType} @@ (SELECT t.tsvector_${tsvectorType} FROM texts AS t 
                                          WHERE t.id = %s)`;

  const result = await dbQuery(
    USER_WORDS_IN_TEXT,
    userId,
    textId,
    textId,
  );

  return result;
};


const getWordInLanguage = async function(word: string, languageId: string): Promise<QueryResult> {
  const WORD_BY_LANGUAGE_AND_WORD: string = `
    SELECT * FROM words 
     WHERE language_id = %L 
           AND 
           word = %L`;

  const result = await dbQuery(WORD_BY_LANGUAGE_AND_WORD, languageId, word);

  return result;
};


const addNew = async function(wordObject: Word): Promise<QueryResult> {
  const {
    languageId,
    word,
  } = wordObject;

  const existingWord = await getWordInLanguage(word, languageId);
  if (existingWord.rowCount > 0) {
    return existingWord;
  }

  const ADD_WORD: string = `
    INSERT INTO words (language_id, word, ts_config)
         VALUES (%L, %L, (SELECT "name" FROM languages AS l WHERE l.id = %L)::regconfig)
      RETURNING *`;

  const result = await dbQuery(
    ADD_WORD,
    languageId,
    word,
    languageId,
  );

  return result;
};


const remove = async function(wordId: number): Promise <QueryResult> {
  const DELETE_WORD: string = `
       DELETE FROM words
        WHERE id = %s
    RETURNING *`;

  const result = await dbQuery(
    DELETE_WORD,
    wordId,
  );

  return result;
};


// Retrieves word status string for given user
const getStatus = async function(wordId: number, userId: number): Promise<QueryResult> {
  const USER_WORD_STATUS: string = `
    SELECT word_status FROM users_words 
     WHERE user_id = %s 
           AND
           word_id = %s`;

  const result = await dbQuery(
    USER_WORD_STATUS,
    userId,
    wordId,
  );

  // if (result.rowCount === 0) return null;

  // return result.rows[0].word_status;
  return result;
};


const addStatus = async function(wordId: number, userId: number, wordStatus: string): Promise<QueryResult> {
  const ADD_USER_WORD_STATUS: string = `
    INSERT INTO users_words (user_id, word_id, word_status)
         VALUES (%s, %s, %L)
      RETURNING *`;

  const result = await dbQuery(
    ADD_USER_WORD_STATUS,
    userId,
    wordId,
    wordStatus,
  );

  // if (result.rowCount === 0) return null;

  // return result.rows[0].word_status;
  return result;
};

const updateStatus = async function(wordId: number, userId: number, wordStatus: string): Promise<QueryResult> {
  const UPDATE_USER_WORD_STATUS: string = `
       UPDATE users_words 
          SET word_status = %L 
        WHERE user_id = %L 
              AND
              word_id = %L
    RETURNING *`;

  const result = await dbQuery(
    UPDATE_USER_WORD_STATUS,
    wordStatus,
    userId,
    wordId,
  );

  // if (result.rowCount === 0) return null;

  // return result.rows[0].word_status;
  return result;
};


export default {
  getAll,
  getById,
  getByLanguageAndUser,
  getUserwordsInText,
  getWordInLanguage,
  addNew,
  remove,
  getStatus,
  addStatus,
  updateStatus,
};