/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiUser, FiCalendar } from 'react-icons/fi';

import { Fragment, useState } from 'react';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  results: Post[];
  next_page: string;
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({
  postsPagination: { results, next_page },
}: HomeProps) {
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  function handleLoadingMore(): void {
    fetch(next_page).then(result =>
      result.json().then(data => {
        const post: Post[] = data.results.map(post => {
          return {
            uid: post.uid,
            data: {
              title: RichText.asText(post.data.title),
              subtitle: RichText.asText(post.data.subtitle),
              author: RichText.asText(post.data.author),
            },
            first_publication_date: new Date(
              post.last_publication_date
            ).toLocaleDateString('pt-Br', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }),
          };
        });

        setPosts([...posts, ...post]);
        setNextPage(data.next_page);
      })
    );
  }

  return (
    <div className={styles.container}>
      {posts.map(post => (
        <Fragment key={post.uid}>
          <Link href={`/post/${post.uid}`}>
            <a>
              <strong>{post.data.title}</strong>
            </a>
          </Link>
          <span>{post.data.subtitle}</span>
          <div>
            <time>
              <FiCalendar /> {post.first_publication_date}
            </time>
            <p>
              <FiUser />
              {post.data.author}
            </p>
          </div>
        </Fragment>
      ))}

      {nextPage && (
        <button
          type="button"
          onClick={handleLoadingMore}
          className={styles.loadingMore}
        >
          Carregar mais posts
        </button>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query<any>(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const posts: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: RichText.asText(post.data.title),
        subtitle: RichText.asText(post.data.subtitle),
        author: RichText.asText(post.data.author),
      },
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd LLL yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
    },
    // revalidate: 60 * 60 * 1 // 1 hours
  };
};
