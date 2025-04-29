export const ANGULAR_BASE_TEMPLATE = `
# Plantilla Base para Aplicación Angular

## Estructura de Archivos
\`\`\`
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── models/
│   ├── shared/
│   │   ├── components/
│   │   ├── directives/
│   │   └── pipes/
│   ├── features/
│   │   └── [feature-name]/
│   │       ├── components/
│   │       ├── services/
│   │       └── [feature-name].module.ts
│   ├── app-routing.module.ts
│   ├── app.component.html
│   ├── app.component.scss
│   ├── app.component.ts
│   └── app.module.ts
├── assets/
├── environments/
└── index.html
\`\`\`

## Componente Principal (app.component.ts)
\`\`\`typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'angular-app';
}
\`\`\`

## Módulo Principal (app.module.ts)
\`\`\`typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
\`\`\`

## Enrutamiento (app-routing.module.ts)
\`\`\`typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
\`\`\`
`;

export const ANGULAR_COMPONENT_TEMPLATE = `
# Plantilla de Componente Angular

\`\`\`typescript
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-component-name',
  templateUrl: './component-name.component.html',
  styleUrls: ['./component-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComponentNameComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }
}
\`\`\`
`;

export const ANGULAR_SERVICE_TEMPLATE = `
# Plantilla de Servicio Angular

\`\`\`typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ServiceNameService {
  private apiUrl = 'https://api.example.com';

  constructor(private http: HttpClient) { }

  getData(): Observable<any[]> {
    return this.http.get<any[]>(\`\${this.apiUrl}/data\`).pipe(
      catchError(error => {
        console.error('Error fetching data', error);
        throw error;
      })
    );
  }
}
\`\`\`
`;

export const ANGULAR_MODULE_TEMPLATE = `
# Plantilla de Módulo Angular

\`\`\`typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: []
})
export class FeatureModule { }
\`\`\`
`;

export const ANGULAR_STACKBLITZ_TEMPLATE = `
Para crear un proyecto en Stackblitz, puedes usar el siguiente enlace:

https://stackblitz.com/fork/angular-ivy

Esto te dará un proyecto Angular básico que puedes personalizar según tus necesidades.
`;