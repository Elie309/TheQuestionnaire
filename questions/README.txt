QUESTIONS FOLDER

This folder contains CSV files with questions for TheQuestions quiz app.

When you create a new question set using the editor and download the CSV file,
you should place it in this folder for the app to be able to load it.

CSV file format:
- First row: header with column names
- Columns: Question ID,Question,Answer,Question Image,Answer Image
- Question ID format: A1-E5 (column+row)

Example:
```
Question ID,Question,Answer,Question Image,Answer Image
A1,What is 2+2?,4,,
A2,Capital of France?,Paris,,
B1,Who wrote Romeo and Juliet?,William Shakespeare,img_a1b2c3_1234567890.jpg,
```

Important notes:
- Don't modify the Question ID format (must be A1-E5)
- Image filenames should match the exact files in the images folder
- The BOM (Byte Order Mark) is important for proper display of Arabic text
