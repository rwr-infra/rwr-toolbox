import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { invoke } from '@tauri-apps/api/core';
import { HomeComponent } from './home/home.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, HomeComponent, RouterLink],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
})
export class AppComponent {
    greetingMessage = '';

    constructor() {}

    greet(event: SubmitEvent, name: string): void {
        event.preventDefault();

        // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
        invoke<string>('greet', { name }).then((text) => {
            this.greetingMessage = text;
        });
    }

    go() {}
}
