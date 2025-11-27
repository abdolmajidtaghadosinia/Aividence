import logging
import time


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger('requests')

    def __call__(self, request):
        start_time = time.time()
        response = self.get_response(request)
        duration_ms = int((time.time() - start_time) * 1000)

        user_id = getattr(getattr(request, 'user', None), 'id', None)
        self.logger.info(
            'method=%s path="%s" status=%s duration_ms=%s user_id=%s ip=%s',
            request.method,
            request.get_full_path(),
            getattr(response, 'status_code', None),
            duration_ms,
            user_id,
            request.META.get('REMOTE_ADDR')
        )
        return response





