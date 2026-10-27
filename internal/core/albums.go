package core

import "trove/internal/library"

func (c *Core) TransferCollectionItems(source, destination int64, videos []library.VideoKey, photos []string, copyItems bool) error {
	err := c.db.TransferCollectionItems(source, destination, videos, photos, copyItems)
	if err == nil {
		c.emit("library", nil)
	}
	return err
}

func (c *Core) CreateAlbum(name string, parent int64) (int64, error) {
	id, err := c.db.CreateAlbum(name, parent)
	if err == nil {
		c.emit("library", nil)
	}
	return id, err
}
func (c *Core) MoveAlbum(id, parent int64) error {
	err := c.db.MoveAlbum(id, parent)
	if err == nil {
		c.emit("library", nil)
	}
	return err
}
func (c *Core) UpdateAlbumItems(id int64, videos []library.VideoKey, photos []string, remove bool) error {
	err := c.db.UpdateAlbumItems(id, videos, photos, remove)
	if err == nil {
		c.emit("library", nil)
	}
	return err
}
func (c *Core) PhotosByCollection(id int64) ([]library.Photo, error) {
	return c.db.PhotosByCollection(id)
}
func (c *Core) AssignPhotos(ids []string, person string) error {
	err := c.db.AssignPhotos(ids, person)
	if err == nil {
		c.emit("library", nil)
	}
	return err
}
