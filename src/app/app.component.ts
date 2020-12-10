import { Component } from '@angular/core';

import { faBars } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'bymartrixx';

  // Fontawesome icons
  faBars = faBars;
  faGithub = faGithub;

  public menuCollapsed = true;
}
