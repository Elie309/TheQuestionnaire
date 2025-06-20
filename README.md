# TheQuestionnaire - Quiz Game

A quiz game web app with a PHP backend. Features a 5x5 question grid with HTML, CSS, JavaScript, and PHP for server-side functionality.

## Features

- **5x5 Question Grid**: Interactive board with questions labeled A1-E5
- **Question & Answer Display**: Click any question to view it, press any key to reveal answer
- **Progress Tracking**: Visual progress indicator and answered question marking
- **Import/Export**: CSV support for custom questions
- **Question Editor**: Create and edit question sets
- **Image Support**: Add images to questions and answers
- **Arabic Support**: Full RTL text support for Arabic content
- **Mobile Responsive**: Works on all devices with touch and keyboard support
- **Offline Ready**: Service worker for offline functionality
- **PHP Backend**: Lightweight PHP backend for file operations and image uploads

## How to Use

1. **Start the Server**: `php -S localhost:8000` in terminal
2. **Start the Game**: Open `http://localhost:8000` in any modern web browser
3. **Select Questions**: Click any cell (A1-E5) to view a question
3. **Reveal Answer**: Press any key while viewing a question to show the answer
4. **Return to Board**: Press any key again to return to the main board
5. **Track Progress**: Answered questions are marked and progress is shown

## Import/Export Questions

### CSV Format

```csv
Question ID,Question,Answer,Question Image,Answer Image
A1,What is 2+2?,4,,
A2,Capital of France?,Paris,,
B1,Who painted Mona Lisa?,Leonardo da Vinci,,
```

### Import Steps

1. Click "Import Questions" button
2. Select a CSV file with the format above
3. Confirm to replace current questions

### Export Steps

1. Click "Export Questions" button
2. Save the generated CSV file
3. Edit in Excel or any spreadsheet program

## Technical Details

- **Minimal Dependencies**: HTML5, CSS3, ES6+ JavaScript, and PHP 7.2+
- **Local Storage**: Game progress saved automatically
- **Responsive Design**: Mobile-first CSS with breakpoints
- **Accessibility**: Keyboard navigation and ARIA labels
- **Progressive Web App**: Service worker for offline functionality

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Customization

### Adding Custom Questions

1. Edit the `getDefaultQuestions()` method in `script.js`
2. Or use the import feature with a CSV file

### Styling

- Modify `styles.css` for custom themes
- CSS custom properties for easy color changes
- Mobile-responsive breakpoints included

### Grid Size

- Change grid dimensions by modifying the grid generation code
- Update CSS grid-template-columns accordingly

## Features Included

✅ 5x5 question grid  
✅ Question/answer display  
✅ Keyboard controls  
✅ Progress tracking  
✅ Import/export CSV  
✅ Mobile responsive  
✅ Offline support  
✅ Local storage  
✅ Accessibility features  
✅ Pure frontend (no backend)

## License

MIT License - Feel free to modify and distribute.

## Image Handling Instructions

### Static HTML Implementation

The app uses a pure JavaScript approach to handle images in a static HTML environment:

1. When creating questions in the editor, you can upload images
2. Images are stored as file references (not data URLs)
3. When saving the question set:
   - The app will download the CSV file with your questions
   - You'll be prompted to download each image separately
   - You must manually place the CSV file in the `questions/` folder
   - You must manually place all image files in the `images/` folder

### Setting Up Your Files

For proper image handling in the static HTML version:

1. Create a folder structure with `questions/` and `images/` folders
2. After downloading question sets and images, place them in the appropriate folders
3. Open `index.html` to use the app with your custom questions and images

### Project Organization

The project structure is detailed at the beginning of this document. Key directories:

- `questions/` - Contains all question CSV files
- `images/` - Stores all needed images like logo, icons.
- `uploads/` - Used for questions images

### Image Naming

Images are automatically renamed with unique IDs to prevent conflicts:

- Format: `img_[random]_[timestamp].[extension]`
- Example: `img_a1b2c3d4_1624534789.jpg`

This ensures:

1. No duplicate image names
2. No conflicts between question sets
3. No issues with special characters in filenames

### Troubleshooting

If images aren't displaying:

1. Check that the images exist in the `images/` folder
2. Verify file permissions (should be readable by the web server)
3. Check browser console for any loading errors

For server upload issues:

1. Check PHP error logs
2. Verify directory permissions
3. Ensure `upload.php` has execute permissions
