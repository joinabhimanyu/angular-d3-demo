import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SnapshotComponent } from '../snapshot/snapshot.component';
import { ProgressNoteComponent } from '../progress-note/progress-note.component';
const routes: Routes = [
  {
    path: '', component: SnapshotComponent, children: []
  },
  {
    path: 'snapshot', component: SnapshotComponent, children: []
  },
  {
    path: 'notes', component: ProgressNoteComponent, children: []
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
