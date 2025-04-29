/**
 * Servicio puente para GrapesJS que permite acceder al editor desde cualquier componente
 * Este servicio mantiene una referencia global al editor actual y al proyecto
 */

import grapesjs, { Editor } from 'grapesjs';

interface EditorRegistration {
  editor: Editor;
  projectId: string;
}

export class GrapesJSBridgeService {
  private static instance: EditorRegistration | null = null;

  /**
   * Registra un editor de GrapesJS para uso global
   * @param editor Instancia del editor de GrapesJS
   * @param projectId ID del proyecto asociado al editor
   */
  public static registerEditor(editor: Editor, projectId: string): void {
    this.instance = { editor, projectId };
    console.log(`Editor de GrapesJS registrado para el proyecto ${projectId}`);
  }

  /**
   * Obtiene la instancia actual del editor
   * @returns La instancia del editor o null si no está registrado
   */
  public static getEditor(): Editor | null {
    return this.instance?.editor || null;
  }

  /**
   * Obtiene el ID del proyecto actual
   * @returns El ID del proyecto o null si no hay editor registrado
   */
  public static getProjectId(): string | null {
    return this.instance?.projectId || null;
  }

  /**
   * Obtiene el contenido HTML del proyecto actual
   * @returns El contenido HTML o null si no hay editor registrado
   */
  public static getHtml(): string | null {
    const editor = this.getEditor();
    return editor ? editor.getHtml() : null;
  }

  /**
   * Obtiene el contenido CSS del proyecto actual
   * @returns El contenido CSS o null si no hay editor registrado
   */
  public static getCss(): string | null {
    const editor = this.getEditor();
    return editor ? editor.getCss() : null;
  }

  /**
   * Obtiene el modelo de datos completo del proyecto actual
   * @returns El modelo de datos o null si no hay editor registrado
   */
  public static getProjectData(): any | null {
    const editor = this.getEditor();
    if (!editor) return null;

    return {
      html: editor.getHtml(),
      css: editor.getCss(),
      components: editor.getComponents().toJSON(),
      styles: editor.getStyle().toJSON(),
      pages: editor.Pages ? editor.Pages.getAll().map(page => ({
        id: page.getId(),
        name: page.getName(),
        is_home: page.get('is_home')
      })) : [],
      currentPage: editor.Pages ? editor.Pages.getSelected()?.getId() : null
    };
  }

  /**
   * Limpia la referencia al editor
   */
  public static clearEditor(): void {
    this.instance = null;
  }

  /**
   * Añade componentes al editor
   * @param components Array de componentes a añadir
   * @returns Boolean indicando si se han añadido correctamente
   */
  public static addComponents(components: any[]): boolean {
    const editor = this.getEditor();
    if (!editor) return false;

    try {
      editor.getComponents().add(components);
      return true;
    } catch (error) {
      console.error('Error al añadir componentes:', error);
      return false;
    }
  }

  /**
   * Obtiene todas las páginas del proyecto actual
   * @returns Array de páginas o array vacío si no hay editor registrado o no hay páginas
   */
  public static getPages(): any[] {
    const editor = this.getEditor();
    if (!editor || !editor.Pages) return [];

    return editor.Pages.getAll().map(page => ({
      id: page.getId(),
      name: page.getName(),
      is_home: page.get('is_home')
    }));
  }

  /**
   * Obtiene la página actual seleccionada en el editor
   * @returns La página actual o null si no hay editor registrado
   */
  public static getCurrentPage(): any | null {
    const editor = this.getEditor();
    if (!editor || !editor.Pages) return null;

    const selectedPage = editor.Pages.getSelected();
    if (!selectedPage) return null;

    return {
      id: selectedPage.getId(),
      name: selectedPage.getName(),
      is_home: selectedPage.get('is_home')
    };
  }
}

export default GrapesJSBridgeService; 