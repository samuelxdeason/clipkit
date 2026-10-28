import { DownloadsPage } from '../features/downloads/downloads-page';
import { Foundation } from './foundation';
import { VideoLibrary } from '../features/videos/video-library';
import { PhotoLibrary } from '../features/photos/photo-library';
import { PeoplePage } from '../features/people/people-page';
import { PersonPage } from '../features/people/person-page';
import { TagsPage } from '../features/tags/tags-page';

/** Feature composition belongs to the app; feature internals never import each other. */
export function Application() {
  const route = new URLSearchParams(window.location.search);
  switch (route.get('view')) {
    case 'foundation':
      return <Foundation />;
    case 'downloads':
      return <DownloadsPage />;
    case 'photos':
      return <PhotoLibrary />;
    case 'people':
      return <PeoplePage />;
    case 'person':
      return route.get('name') ? (
        <PersonPage
          name={route.get('name')!}
          renderMedia={(kind) =>
            kind === 'videos' ? (
              <VideoLibrary key={`videos-${route.get('name')}`} person={route.get('name')!} />
            ) : (
              <PhotoLibrary key={`photos-${route.get('name')}`} person={route.get('name')!} />
            )
          }
        />
      ) : (
        <PeoplePage />
      );
    case 'tags':
      return <TagsPage />;
    default:
      return <VideoLibrary demo={route.get('demo') === '1'} />;
  }
}
