/* eslint-disable react/no-danger */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { Fragment } from 'react';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { Head } from 'next/document';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  function redingTime(): number {
    const lengthText = post.data.content.reduce((total, contentItem) => {
      total += contentItem.heading.split(' ').length;

      const words = contentItem.body.map(item => item.text.split(' ').length);
      words.map(word => (total += word));

      return total;
    }, 0);

    return Math.ceil(lengthText / 200);
  }

  if (router.isFallback) return <h1>Carregando...</h1>;

  return (
    <>
      <Head>
        <title>{post.data.title} | Space Traveling</title>
      </Head>

      <img className={styles.banner} src={post.data.banner.url} alt="banner" />
      <article className={styles.container}>
        <h1>{post.data.title}</h1>
        <div>
          <time>
            <FiCalendar />{' '}
            {format(new Date(post.first_publication_date), 'dd LLL yyyy', {
              locale: ptBR,
            })}
          </time>
          <p>
            <FiUser /> {post.data.author}
          </p>
          <p>
            <FiClock /> {redingTime()} min
          </p>
        </div>
        {post.data.content.map(content => (
          <Fragment key={content.heading}>
            <h2>{content.heading}</h2>
            <div
              className={styles.postContent}
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </Fragment>
        ))}
      </article>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query<any>(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
      pageSize: 10,
    }
  );

  const params = postsResponse.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: params,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient(req);

  const response = await prismic.getByUID<any>('posts', String(slug), {});

  const post = {
    data: {
      title: RichText.asText(response.data.title),
      banner: {
        url: response.data.banner.url,
      },
      author: RichText.asText(response.data.author),
      content: response.data.content.map(c => {
        return {
          heading: c.heading,
          body: {
            text: c.body,
          },
        };
      }),
    },
    first_publication_date: response.first_publication_date,
  };

  return {
    props: {
      post,
    },
  };
};
