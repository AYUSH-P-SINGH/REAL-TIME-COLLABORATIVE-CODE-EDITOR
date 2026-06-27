// Pagination Utility
const paginationSchema = require('./validation.schemas').paginationSchema;

class PaginationUtil {
  static validate(page, limit) {
    const validated = paginationSchema.parse({ page, limit });
    return {
      page: validated.page,
      limit: validated.limit,
    };
  }

  static getSkip(page, limit) {
    return (page - 1) * limit;
  }

  static getOptions(page, limit) {
    return {
      skip: this.getSkip(page, limit),
      limit,
    };
  }

  static formatResponse(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  static async paginate(query, page, limit, select = null, populate = null) {
    try {
      const { page: validPage, limit: validLimit } = this.validate(page, limit);
      const skip = this.getSkip(validPage, validLimit);

      let queryBuilder = query.skip(skip).limit(validLimit);

      if (select) {
        queryBuilder = queryBuilder.select(select);
      }

      if (populate) {
        if (Array.isArray(populate)) {
          populate.forEach((p) => {
            queryBuilder = queryBuilder.populate(p);
          });
        } else {
          queryBuilder = queryBuilder.populate(populate);
        }
      }

      const [data, total] = await Promise.all([
        queryBuilder.exec(),
        query.model.countDocuments(query.getFilter ? query.getFilter() : {}),
      ]);

      return this.formatResponse(data, total, validPage, validLimit);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PaginationUtil;
