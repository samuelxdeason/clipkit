package core

import "trove/internal/library"

func (c *Core) TrashMedia(videos []library.VideoKey, photos []string) error {
	err := c.db.TrashMedia(videos, photos)
	if err == nil {
		c.emit("library", nil)
	}
	return err
}
