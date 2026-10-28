import { Pagination } from '@ark-ui/react/pagination';
import { Button } from './button';
import { css } from '../../styled-system/css';

export function Paging({
  page,
  count,
  pageSize,
  onPageChange,
}: {
  page: number;
  count: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Pagination.Root
      count={count}
      pageSize={pageSize}
      page={page}
      onPageChange={(event) => onPageChange(event.page)}
      siblingCount={1}
      className={css({ display: 'flex', gap: '2', flexWrap: 'wrap', alignItems: 'center' })}
    >
      <Pagination.PrevTrigger asChild>
        <Button variant="quiet">Previous</Button>
      </Pagination.PrevTrigger>
      <Pagination.Context>
        {(context) =>
          context.pages.map((item, index) =>
            item.type === 'page' ? (
              <Pagination.Item key={item.value} {...item} asChild>
                <Button variant={context.page === item.value ? 'quiet' : 'quiet'}>
                  {item.value}
                </Button>
              </Pagination.Item>
            ) : (
              <Pagination.Ellipsis key={`gap-${index}`} index={index}>
                …
              </Pagination.Ellipsis>
            ),
          )
        }
      </Pagination.Context>
      <Pagination.NextTrigger asChild>
        <Button variant="quiet">Next</Button>
      </Pagination.NextTrigger>
    </Pagination.Root>
  );
}
