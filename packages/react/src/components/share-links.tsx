import * as React from 'react'
import useClipboard from 'react-use-clipboard'
import {getShareUrl} from '../utils'
import {
  FacebookIcon,
  HackerNewsIcon,
  LinkedInIcon,
  LinkIcon,
  RedditIcon,
  TwitterIcon,
} from './share-icons'

type ShareLinkProps = {
  link: string
  message?: string
  className?: string
}

const defaultStyle =
  'rounded-lg bg-gray-400 bg-opacity-10 hover:bg-opacity-20 transition-all ease-in-out duration-200 flex items-center justify-center p-3 m-1'

const Twitter: React.FC<React.PropsWithChildren<ShareLinkProps>> = ({
  link,
  message,
  className = defaultStyle,
  children,
}) => (
  <a
    href={getShareUrl('twitter', link)}
    className={className}
    target="_blank"
    rel="noopener noreferrer"
  >
    <TwitterIcon className="w-4 h-4" />
    {children || <span className="sr-only">share on twitter</span>}
  </a>
)

const Facebook: React.FC<React.PropsWithChildren<ShareLinkProps>> = ({
  link,
  className = defaultStyle,
  children,
}) => (
  <a
    href={getShareUrl('facebook', link)}
    className={className}
    target="_blank"
    rel="noopener noreferrer"
  >
    <FacebookIcon className="w-4 h-4" />
    {children || <span className="sr-only">share on facebook</span>}
  </a>
)

const Reddit: React.FC<React.PropsWithChildren<ShareLinkProps>> = ({
  link,
  message,
  className = defaultStyle,
  children,
}) => (
  <a
    href={getShareUrl('reddit', link)}
    className={className}
    target="_blank"
    rel="noopener noreferrer"
  >
    <RedditIcon className="w-4 h-4" />
    {children || <span className="sr-only">share on reddit</span>}
  </a>
)

const CopyToClipboard: React.FC<
  React.PropsWithChildren<ShareLinkProps & {onSuccess: () => void}>
> = ({
  link,
  onSuccess,
  className = defaultStyle + ' relative text-xs',
  children,
}) => {
  const [_, copyToClipboard] = useClipboard(link, {
    successDuration: 700,
  })

  return (
    <button
      type="button"
      onClick={() => {
        copyToClipboard()
        onSuccess()
      }}
      className={className}
    >
      <LinkIcon className="w-4 h-4" />
      {children || <span className="sr-only">copy url to clipboard</span>}
    </button>
  )
}

const LinkedIn: React.FC<React.PropsWithChildren<ShareLinkProps>> = ({
  link,
  className = defaultStyle,
  children,
}) => (
  <a
    href={getShareUrl('linkedin', link)}
    className={className}
    target="_blank"
    rel="noopener noreferrer"
  >
    <LinkedInIcon className="w-4 h-4" />
    {children || <span className="sr-only">share on linkedin</span>}
  </a>
)

const Hacker: React.FC<React.PropsWithChildren<ShareLinkProps>> = ({
  link,
  message,
  className = defaultStyle,
  children,
}) => (
  <a
    href={getShareUrl('hacker', link)}
    className={className}
    target="_blank"
    rel="noopener noreferrer"
  >
    <HackerNewsIcon className="w-4 h-4" />
    {children || <span className="sr-only">share on hacker news</span>}
  </a>
)

export {Twitter, Facebook, Reddit, CopyToClipboard, LinkedIn, Hacker}
