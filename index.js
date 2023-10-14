import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import i18n from 'i18n';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

i18n.configure({
  locales: ['en', 'es', 'ja'], // Definir los idiomas que soporta tu aplicación
  directory: path.join(__dirname, '/locales'),// Directorio donde se encuentran los archivos de traducción
});

async function chooseLanguage() {
    const languageAnswer = await inquirer.prompt([
      {
        type: "list",
        name: "language",
        message: "Select your preferred language / Selecciona tu idioma preferido:",
        choices: [
          { name: "English", value: "en" },
          { name: "Español", value: "es" },
          { name: "日本語", value: "ja" },
        ],
      },
    ]);

    // console.log(languageAnswer);
    
    i18n.setLocale(languageAnswer.language);
  
    return main();
  }

// Función principal que maneja la lógica de la aplicación
async function main() {

  // Solicita al usuario si desea cambiar el nombre de los archivos
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "changeName",
      message: i18n.__("changeNameMessage"), // Usar i18n para obtener el mensaje en el idioma actual
      choices: [i18n.__("yes"), i18n.__("no")],
    },
  ]);

  // Si el usuario desea cambiar el nombre de los archivos
  if (answer.changeName === i18n.__("yes")) {
    // Solicita al usuario la ruta de la carpeta donde se encuentran los archivos
    const folderPath = await inquirer.prompt({
      type: "input",
      name: "folderPath",
      message: i18n.__("folderPathMessage"),
    });

    try {
      // Lee los archivos de la carpeta
      const files = await fs.readdir(folderPath.folderPath);
      // Solicita al usuario el nuevo nombre para los archivos
      const newName = await inquirer.prompt({
        type: "input",
        name: "newName",
        message: i18n.__("newNameMessage"),
      });

      // Almacena los archivos con su fecha de creación
      const filesWithCreationDate = [];
      for (const file of files) {
        // Define la ruta completa del archivo
        const filePath = path.join(folderPath.folderPath, file);
        
        // Obtiene las estadísticas del archivo
        const stat = await fs.stat(filePath);
        // Verifica si el objeto es un archivo
        if (stat.isFile()) {
          // Obtiene la fecha de creación del archivo
          const creationDate = stat.birthtime;
          // Agrega el archivo y su fecha de creación a la lista
          filesWithCreationDate.push({ file, creationDate });
        }
      }

      // Ordena los archivos por su fecha de creación
      filesWithCreationDate.sort((a, b) => a.creationDate - b.creationDate);

      // Renombra los archivos
      for (let index = 0; index < filesWithCreationDate.length; index++) {
        // Obtiene el objeto de archivo de la lista ordenada
        const fileObj = filesWithCreationDate[index];
        // Obtiene la extensión del archivo
        const ext = path.extname(fileObj.file);
        // Define la ruta antigua del archivo
        const oldPath = path.join(folderPath.folderPath, fileObj.file);
        // Define el nuevo nombre del archivo con el índice y la extensión
        const newFile = `${newName.newName}_${index + 1}${ext}`;
        // Define la nueva ruta del archivo
        const newPath = path.join(folderPath.folderPath, newFile);

        try {
          // Intenta renombrar el archivo
          await fs.rename(oldPath, newPath);
          console.log(i18n.__("renameSuccess", { oldName: fileObj.file, newName: newFile }));
        } catch (renameErr) {
          // Si hay un error al renombrar, lo muestra
          console.error(i18n.__("renameError", { fileName: fileObj.file, error: renameErr }));
        }
      }

      // Muestra un mensaje de éxito cuando todos los archivos han sido renombrados
      console.log(i18n.__("allRenamedSuccess"));
    } catch (err) {
      // Si hay un error general, lo muestra
      console.error(i18n.__("renameErrorGeneral", { error: err }));
    }
  } else {
    // Si el usuario no desea cambiar el nombre de los archivos, muestra un mensaje
    console.log(i18n.__("noChanges"));
  }
}

chooseLanguage();
