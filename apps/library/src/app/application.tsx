import { DownloadsPage } from '../features/downloads/downloads-page';
import { Foundation } from './foundation';
import { VideoLibrary } from '../features/videos/video-library';
import { PhotoLibrary } from '../features/photos/photo-library';
import { PeoplePage } from '../features/people/people-page';
import { PersonPage } from '../features/people/person-page';
import { TagsPage } from '../features/tags/tags-page';
import { CollectionsPage } from '../features/collections/collections-page';
import { CollectionPage } from '../features/collections/collection-page';
import { VideoPlayer } from '../features/videos/video-player';
import { fromCatalogue } from '../features/videos/model';

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
    case 'collections':
      return <CollectionsPage />;
    case 'collection':
      return (
        <CollectionPage
          key={route.get('id')}
          id={Number(route.get('id')) || 0}
          renderPlayer={(video, client, controls) => (
            <VideoPlayer
              key={`${video.site}:${video.id}`}
              video={fromCatalogue(video, [], (path) => client.media(path))}
              client={client}
              {...controls}
            />
          )}
        />
      );
    default:
      return <VideoLibrary demo={route.get('demo') === '1'} />;
  }
}
