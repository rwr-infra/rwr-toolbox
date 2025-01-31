import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { NotfoundComponent } from './notfound/notfound.component';

export const routes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
    },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    {
        path: '**',
        component: NotfoundComponent,
    },
];
