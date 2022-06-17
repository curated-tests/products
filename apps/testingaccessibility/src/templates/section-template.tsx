import React from 'react'
import {getPathForSection} from 'utils/get-resource-paths'
import {getSectionProgressForUser} from 'utils/progress'
import {ChevronRightIcon} from '@heroicons/react/solid'
import {useProgress} from 'context/progress-context'
import {PortableText} from '@portabletext/react'
import {SanityDocument} from '@sanity/client'
import PortableTextComponents from 'components/portable-text'
import BreadcrumbNav from 'components/breadcrumb'
import Layout from 'components/app/layout'
import indexOf from 'lodash/indexOf'
import find from 'lodash/find'
import Image from 'next/image'
import Link from 'next/link'
import cx from 'classnames'
import {ProgressToggle} from './lesson-template'
import {useSession} from 'next-auth/react'
import {isEmpty} from 'lodash'
import {LessonProgress} from '@prisma/client'

type SectionTemplateProps = {
  section: SanityDocument
  module?: SanityDocument
  modules?: SanityDocument[]
}

const SectionTemplate: React.FC<SectionTemplateProps> = ({
  section,
  module,
  modules,
}) => {
  const {slug: sectionSlug, title, body, lessons} = section
  const image = section.image ?? module?.image
  const {progress, toggleLessonComplete} = useProgress()
  const {data: session} = useSession()
  const currentLessonProgress = find(progress, {lessonSlug: sectionSlug})
  const isCurrentLessonCompleted = !isEmpty(currentLessonProgress?.completedAt)

  const currentSectionIndex = module
    ? indexOf(module.sections, find(module.sections, {slug: sectionSlug}))
    : -1
  const nextUpSection = module && module.sections[currentSectionIndex + 1]
  return (
    <Layout className="flex-grow">
      <div className="bg-gray-100">
        <div className="max-w-screen-lg mx-auto w-full py-4 lg:px-1 px-2 overflow-x-auto">
          <BreadcrumbNav module={module} section={section} />
        </div>
      </div>
      <div className="flex-grow">
        <header className="bg-green-700 bg-noise text-white pt-8 pb-12 px-5">
          <div className="flex items-center justify-center gap-5 max-w-screen-sm mx-auto min-h-[180px]">
            <h1 className="font-heading md:text-5xl text-4xl font-bold w-full">
              {title}
            </h1>
            {image && (
              <div className="flex-shrink-0 md:block flex items-center justify-center translate-y-28 sm:-translate-x-2">
                <Image
                  src={image.url}
                  width={150}
                  height={150}
                  quality={100}
                  alt={image.alt}
                />
              </div>
            )}
          </div>
        </header>
        {lessons && (
          <div className="-mt-4 max-w-screen-sm w-full mx-auto">
            <LessonsNavigator
              lessons={lessons}
              progress={progress}
              sectionSlug={sectionSlug}
              module={module}
            />
          </div>
        )}
        <main className="mx-auto xl:px-0 px-5 py-10 sm:pb-24 pb-16 lg:gap-10 gap-5">
          <article className="max-w-screen-sm mx-auto col-span-7">
            <div className="">
              <div className="prose lg:prose-lg max-w-none">
                <PortableText
                  value={body}
                  components={PortableTextComponents}
                />
              </div>
            </div>
          </article>
        </main>
      </div>
      {session && !lessons && (
        <ProgressToggle
          isCurrentLessonCompleted={isCurrentLessonCompleted}
          toggleLessonComplete={toggleLessonComplete}
          slug={sectionSlug}
        />
      )}
      {nextUpSection && currentSectionIndex === 0 && (
        <div className="w-full py-16 bg-gray-50 flex items-center justify-center gap-5">
          <Link
            href={{
              pathname: '/learn/[module]/[section]',
              query: getPathForSection(nextUpSection.slug, modules as any),
            }}
          >
            <a className="px-5 py-4 rounded-md bg-gray-900 transition text-white flex">
              <span className="pr-1">
                Up next:{' '}
                <span className="font-semibold">{nextUpSection.title}</span>
              </span>
              <ChevronRightIcon className="w-4" aria-hidden="true" />
            </a>
          </Link>
        </div>
      )}
    </Layout>
  )
}

export default SectionTemplate

const LessonsNavigator = ({
  lessons,
  progress,
  module,
  sectionSlug,
}: {
  lessons: SanityDocument[]
  progress: LessonProgress[]
  module?: SanityDocument
  sectionSlug: string
}) => {
  return (
    <nav
      aria-label="lesson navigator"
      className="sm:p-8 p-4 bg-white border border-gray-100 sm:rounded-md shadow-xl"
    >
      <h2 className="font-semibold uppercase text-xs text-green-800 pb-2">
        Lessons
      </h2>
      <ol className="list-none divide-y divide-gray-100">
        {lessons.map((lesson: SanityDocument, i: number) => {
          const {title, slug} = lesson
          const isCompleted = find(progress, {
            lessonSlug: slug,
          })?.completedAt
          return (
            <li
              key={slug}
              className="group marker:text-xs marker:text-gray-500"
            >
              <Link
                href={{
                  pathname: module
                    ? '/learn/[module]/[section]/[lesson]'
                    : '/[section]/[lesson]',
                  query: module
                    ? {
                        module: module.slug,
                        section: sectionSlug,
                        lesson: slug,
                      }
                    : {
                        section: sectionSlug,
                        lesson: slug,
                      },
                }}
                passHref
              >
                <a
                  aria-label={`${title} ${isCompleted ? '(completed)' : ''}`}
                  data-index={isCompleted ? '✓' : i + 1}
                  className={cx(
                    `px-3 hover:bg-gray-50 w-full font-semibold py-4 hover:text-gray-900 text-gray-700 relative items-center inline-flex before:font-semibold before:flex before:items-center before:justify-center before:font-mono before:content-[attr(data-index)] before:w-5 before:h-5 before:border before:left-0 before:rounded-full before:flex-shrink-0`,
                    {
                      'before:text-[0.55em] before:text-gray-500 before:border-gray-300':
                        !isCompleted,
                      'before:text-sm before:text-white before:border-green-500 before:bg-green-500':
                        isCompleted,
                    },
                  )}
                >
                  <span className="pl-3">{title} </span>
                  {isCompleted && <span className="sr-only">(completed)</span>}
                </a>
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
