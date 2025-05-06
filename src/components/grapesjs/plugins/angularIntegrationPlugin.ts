import { Plugin } from 'grapesjs';

/**
 * Plugin para la integración de GrapesJS con componentes Angular
 */
const angularIntegrationPlugin: Plugin = (editor) => {
  // Añadir tipo de componente para Angular
  editor.DomComponents.addType('angular-component', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: true,
        attributes: { class: 'angular-component' },
        traits: [
          {
            type: 'text',
            name: 'selector',
            label: 'Selector'
          },
          {
            type: 'text',
            name: 'inputs',
            label: 'Inputs (JSON)'
          },
          {
            type: 'text',
            name: 'outputs',
            label: 'Outputs (JSON)'
          }
        ]
      }
    },
    view: {
      init() {
        // Inicialización específica para la vista
        this.listenTo(this.model, 'change:selector change:inputs change:outputs', this.render);
      },
      onRender() {
        const selector = this.model.get('traits')?.where({ name: 'selector' })[0]?.get('value') || '';
        if (selector) {
          this.el.setAttribute('data-angular-component', selector);
        }
      }
    }
  });

  // Añadir bloque para componentes Angular
  editor.BlockManager.add('angular-component', {
    label: 'Componente Angular',
    category: 'Aplicaciones',
    content: {
      type: 'angular-component',
      content: `<div class="angular-component-placeholder p-3 border rounded bg-light text-center">
        <i class="fab fa-angular fa-2x mb-2"></i>
        <p>Componente Angular</p>
        <small>Configura el selector y inputs en el panel de propiedades</small>
      </div>`
    }
  });

  // Agregar exportador de código para Angular
  editor.Commands.add('export-angular', {
    run: (editor) => {
      const html = editor.getHtml();
      const css = editor.getCss();
      
      // Extraer componentes Angular
      const angularComponents = [];
      const components = editor.DomComponents.getWrapper().find('[data-angular-component]');
      
      for (let i = 0; i < components.length; i++) {
        const component = components[i];
        const selector = component.getAttributes()['data-angular-component'];
        const inputs = component.get('traits')?.where({ name: 'inputs' })[0]?.get('value') || '{}';
        const outputs = component.get('traits')?.where({ name: 'outputs' })[0]?.get('value') || '{}';
        
        angularComponents.push({
          selector,
          inputs: JSON.parse(inputs),
          outputs: JSON.parse(outputs)
        });
      }
      
      // Generar estructura de proyecto Angular completo
      const angularProject = generateAngularProject(html, css, angularComponents);
      
      return angularProject;
    }
  });

  /**
   * Generar estructura completa de proyecto Angular
   */
  const generateAngularProject = (html: string, css: string, components: any[]) => {
    // Convertir HTML a componente Angular
    const cleanHtml = html
      .replace(/<!DOCTYPE html>/gi, '')
      .replace(/<html.*?>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head>.*?<\/head>/gis, '')
      .replace(/<body.*?>/gi, '')
      .replace(/<\/body>/gi, '');
    
    // Estructura básica del proyecto
    const project = {
      // Archivos de configuración
      'angular.json': generateAngularConfigFile(),
      'package.json': generatePackageJson(),
      'tsconfig.json': generateTsConfig(),
      
      // Archivos principales
      'src/main.ts': generateMainTs(),
      'src/index.html': generateIndexHtml(),
      'src/styles.scss': css,
      
      // Archivos de la aplicación
      'src/app/app.component.ts': generateAppComponent(cleanHtml),
      'src/app/app.component.html': cleanHtml,
      'src/app/app.component.scss': css,
      'src/app/app.module.ts': generateAppModule(components),
      'src/app/app-routing.module.ts': generateRoutingModule(),
      
      // Material Design
      'src/app/material.module.ts': generateMaterialModule(),
      
      // Componentes adicionales
      ...generateComponentsFiles(components)
    };
    
    return project;
  };
  
  /**
   * Generar archivos para los componentes extraídos
   */
  const generateComponentsFiles = (components: any[]) => {
    const files: Record<string, string> = {};
    
    components.forEach((component, index) => {
      const name = component.selector.replace(/\[|\]|\(|\)/g, '').replace(/-/g, '_');
      const className = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
      
      // Componente TS
      files[`src/app/components/${name}/${name}.component.ts`] = `import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: '${component.selector}',
  templateUrl: './${name}.component.html',
  styleUrls: ['./${name}.component.scss']
})
export class ${className}Component {
  ${generateComponentInputs(component.inputs)}
  
  ${generateComponentOutputs(component.outputs)}
}`;
      
      // Template HTML
      files[`src/app/components/${name}/${name}.component.html`] = `<div class="${name}">
  <h2>{{ title }}</h2>
  <div class="content">
    <ng-content></ng-content>
  </div>
</div>`;
      
      // Estilos SCSS
      files[`src/app/components/${name}/${name}.component.scss`] = `.${name} {
  display: block;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  
  h2 {
    margin-top: 0;
    color: #333;
  }
  
  .content {
    margin-top: 16px;
  }
}`;
    });
    
    return files;
  };
  
  /**
   * Generar inputs para un componente
   */
  const generateComponentInputs = (inputs: Record<string, any>) => {
    return Object.entries(inputs)
      .map(([name, type]) => `@Input() ${name}: ${typeof type === 'string' ? type : 'any'} = ${getDefaultValue(type)};`)
      .join('\n  ');
  };
  
  /**
   * Generar outputs para un componente
   */
  const generateComponentOutputs = (outputs: Record<string, any>) => {
    return Object.entries(outputs)
      .map(([name, _]) => `@Output() ${name} = new EventEmitter<any>();`)
      .join('\n  ');
  };
  
  /**
   * Obtener valor por defecto según el tipo
   */
  const getDefaultValue = (type: any) => {
    if (typeof type === 'string') {
      switch (type.toLowerCase()) {
        case 'string': return "''";
        case 'number': return '0';
        case 'boolean': return 'false';
        case 'any[]':
        case 'array': return '[]';
        case 'object': return '{}';
        default: return "''";
      }
    }
    
    return typeof type === 'object' ? JSON.stringify(type) : "''";
  };
  
  /**
   * Generar archivo package.json
   */
  const generatePackageJson = () => {
    return JSON.stringify({
      "name": "grapesjs-angular-project",
      "version": "0.0.1",
      "scripts": {
        "ng": "ng",
        "start": "ng serve",
        "build": "ng build",
        "watch": "ng build --watch --configuration development",
        "test": "ng test"
      },
      "private": true,
      "dependencies": {
        "@angular/animations": "^17.0.0",
        "@angular/cdk": "^17.0.0",
        "@angular/common": "^17.0.0",
        "@angular/compiler": "^17.0.0",
        "@angular/core": "^17.0.0",
        "@angular/forms": "^17.0.0",
        "@angular/material": "^17.0.0",
        "@angular/platform-browser": "^17.0.0",
        "@angular/platform-browser-dynamic": "^17.0.0",
        "@angular/router": "^17.0.0",
        "rxjs": "~7.8.0",
        "tslib": "^2.3.0",
        "zone.js": "~0.14.2"
      },
      "devDependencies": {
        "@angular-devkit/build-angular": "^17.0.0",
        "@angular/cli": "^17.0.0",
        "@angular/compiler-cli": "^17.0.0",
        "@types/jasmine": "~5.1.0",
        "jasmine-core": "~5.1.0",
        "karma": "~6.4.0",
        "karma-chrome-launcher": "~3.2.0",
        "karma-coverage": "~2.2.0",
        "karma-jasmine": "~5.1.0",
        "karma-jasmine-html-reporter": "~2.1.0",
        "typescript": "~5.2.2"
      }
    }, null, 2);
  };
  
  /**
   * Generar archivo angular.json
   */
  const generateAngularConfigFile = () => {
    return JSON.stringify({
      "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
      "version": 1,
      "newProjectRoot": "projects",
      "projects": {
        "grapesjs-angular-project": {
          "projectType": "application",
          "schematics": {
            "@schematics/angular:component": {
              "style": "scss"
            }
          },
          "root": "",
          "sourceRoot": "src",
          "prefix": "app",
          "architect": {
            "build": {
              "builder": "@angular-devkit/build-angular:browser",
              "options": {
                "outputPath": "dist/grapesjs-angular-project",
                "index": "src/index.html",
                "main": "src/main.ts",
                "polyfills": ["zone.js"],
                "tsConfig": "tsconfig.json",
                "assets": [
                  "src/favicon.ico",
                  "src/assets"
                ],
                "styles": [
                  "src/styles.scss"
                ],
                "scripts": []
              }
            },
            "serve": {
              "builder": "@angular-devkit/build-angular:dev-server",
              "options": {
                "browserTarget": "grapesjs-angular-project:build"
              }
            }
          }
        }
      }
    }, null, 2);
  };
  
  /**
   * Generar archivo tsconfig.json
   */
  const generateTsConfig = () => {
    return JSON.stringify({
      "compileOnSave": false,
      "compilerOptions": {
        "baseUrl": "./",
        "outDir": "./dist/out-tsc",
        "forceConsistentCasingInFileNames": true,
        "strict": false,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "sourceMap": true,
        "declaration": false,
        "downlevelIteration": true,
        "experimentalDecorators": true,
        "moduleResolution": "node",
        "importHelpers": true,
        "target": "ES2022",
        "module": "ES2022",
        "lib": [
          "ES2022",
          "dom"
        ],
        "useDefineForClassFields": false
      },
      "angularCompilerOptions": {
        "enableI18nLegacyMessageIdFormat": false,
        "strictInjectionParameters": true,
        "strictInputAccessModifiers": true,
        "strictTemplates": true
      }
    }, null, 2);
  };
  
  /**
   * Generar main.ts
   */
  const generateMainTs = () => {
    return `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`;
  };
  
  /**
   * Generar index.html
   */
  const generateIndexHtml = () => {
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>GrapesJS Angular Project</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<body class="mat-typography">
  <app-root></app-root>
</body>
</html>`;
  };
  
  /**
   * Generar app.component.ts
   */
  const generateAppComponent = (html: string) => {
    return `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'GrapesJS Angular Project';
}`;
  };
  
  /**
   * Generar app.module.ts
   */
  const generateAppModule = (components: any[]) => {
    const componentImports = components.map((comp, idx) => {
      const name = comp.selector.replace(/\[|\]|\(|\)/g, '').replace(/-/g, '_');
      const className = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
      return `import { ${className}Component } from './components/${name}/${name}.component';`;
    }).join('\n');
    
    const componentDeclarations = components.map((comp) => {
      const name = comp.selector.replace(/\[|\]|\(|\)/g, '').replace(/-/g, '_');
      const className = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
      return `    ${className}Component`;
    }).join(',\n');
    
    return `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from './material.module';
import { AppComponent } from './app.component';
${componentImports}

@NgModule({
  declarations: [
    AppComponent${componentDeclarations ? ',\n' + componentDeclarations : ''}
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    MaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }`;
  };
  
  /**
   * Generar app-routing.module.ts
   */
  const generateRoutingModule = () => {
    return `import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }`;
  };
  
  /**
   * Generar material.module.ts
   */
  const generateMaterialModule = () => {
    return `import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';

@NgModule({
  exports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    MatPaginatorModule
  ]
})
export class MaterialModule { }`;
  };

  console.log('[GrapesJS] Plugin de integración Angular cargado');
};

export default angularIntegrationPlugin; 